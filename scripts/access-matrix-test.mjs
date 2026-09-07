// Two matrices:
//
//   1. The four-state listing gating matrix — the decision table the revenue
//      model turns on. Baseline: 49 assertions, all passing.
//   2. The post-login landing matrix — "one email, one role". Was a four-role
//      x two-door admission matrix (2026-08-31); the doors were removed
//      2026-09-07 and it now asserts where each role lands instead.
//
// Drives lib/access/resolve.ts directly with every viewer shape and asserts the
// full expected matrix, including the cases that cost money if they regress:
// an already-unlocked group is never charged twice, and a subscriber is never
// charged at all. Pairs with scripts/leak-test.mjs, which proves the same
// decisions actually hold over HTTP for a guest.
//
// Live pricing is read from the settings table so this tests the real
// configuration rather than assumed defaults.
//
//   node scripts/access-matrix-test.mjs

import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { resolveListingAccess } from "../lib/access/resolve.ts"
import { FIELD_GROUPS } from "../lib/access/types.ts"
import { ROLES, landingPathForRole, postLoginPath } from "../lib/auth/landing.ts"

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^"(.*)"$/, "$1")
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const { data: rows, error } = await admin.from("settings").select("key,value")
if (error) {
  console.error("Could not read settings:", error.message)
  process.exit(1)
}

const raw = Object.fromEntries(rows.map((r) => [r.key, r.value]))
const num = (key) => Number(typeof raw[key] === "object" ? raw[key]?.value : raw[key])

const settings = {
  freeSignupCredits: num("free_signup_credits"),
  annualPrice: num("annual_price"),
  servicePackagePrice: num("service_package_price"),
  successFeePct: num("success_fee_pct"),
  creditCost: {
    flat_floor: num("credit_cost_flat_floor"),
    inspection: num("credit_cost_inspection"),
    officer_contact: num("credit_cost_officer_contact"),
  },
}

console.log("Live pricing from settings:", JSON.stringify(settings.creditCost))
console.log(`Free signup credits: ${settings.freeSignupCredits}\n`)

const viewer = (over) => ({
  userId: "test-user",
  creditBalance: 0,
  hasActiveSubscription: false,
  unlockedGroups: [],
  ...over,
})

const cases = [
  {
    name: "guest (signed out)",
    viewer: null,
    expectState: "guest",
    expect: () => ({ visible: false, action: "signup" }),
  },
  {
    name: "member, fresh signup (5 credits)",
    viewer: viewer({ creditBalance: settings.freeSignupCredits }),
    expectState: "member_with_credits",
    expect: () => ({ visible: false, action: "spend" }),
  },
  {
    name: "member, exactly 1 credit",
    viewer: viewer({ creditBalance: 1 }),
    expectState: "member_with_credits",
    expect: () => ({ visible: false, action: "spend" }),
  },
  {
    name: "member, 0 credits",
    viewer: viewer({ creditBalance: 0 }),
    expectState: "member_no_credits",
    expect: () => ({ visible: false, action: "upgrade" }),
  },
  {
    name: "member, 0 credits, one group already unlocked",
    viewer: viewer({ creditBalance: 0, unlockedGroups: ["inspection"] }),
    expectState: "member_no_credits",
    expect: (g) =>
      g === "inspection"
        ? { visible: true, via: "unlocked" }
        : { visible: false, action: "upgrade" },
  },
  {
    name: "subscriber (active annual)",
    viewer: viewer({ hasActiveSubscription: true, creditBalance: 0 }),
    expectState: "subscriber",
    expect: () => ({ visible: true, via: "subscription" }),
  },
  {
    name: "subscriber who also has an unlock (must not double-charge)",
    viewer: viewer({ hasActiveSubscription: true, unlockedGroups: ["flat_floor"] }),
    expectState: "subscriber",
    expect: () => ({ visible: true, via: "subscription" }),
  },
]

let failures = 0
let assertions = 0

for (const c of cases) {
  const access = resolveListingAccess(c.viewer, settings)
  const lines = []

  if (access.state !== c.expectState) {
    lines.push(`state: expected "${c.expectState}", got "${access.state}"`)
  }
  assertions++

  for (const group of FIELD_GROUPS) {
    const got = access.decide(group)
    const want = c.expect(group)
    assertions++

    if (got.visible !== want.visible) {
      lines.push(`${group}: expected visible=${want.visible}, got ${got.visible}`)
      continue
    }
    if (want.visible && got.via !== want.via) {
      lines.push(`${group}: expected via="${want.via}", got "${got.via}"`)
    }
    if (!want.visible) {
      if (got.action !== want.action) {
        lines.push(`${group}: expected action="${want.action}", got "${got.action}"`)
      }
      if (got.cost !== settings.creditCost[group]) {
        lines.push(
          `${group}: cost ${got.cost} does not match live setting ${settings.creditCost[group]}`,
        )
      }
    }
    // canSee must never disagree with decide — the redactor trusts both.
    if (access.canSee(group) !== got.visible) {
      lines.push(`${group}: canSee disagrees with decide`)
    }
    assertions++
  }

  const ok = lines.length === 0
  if (!ok) failures++
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.name}  [state=${access.state}]`)
  for (const l of lines) console.log(`        ${l}`)
}

console.log(`\n${assertions} assertions across ${cases.length} viewer states`)
console.log(
  failures === 0
    ? "RESULT: PASS — gating matrix correct"
    : `RESULT: FAIL — ${failures} state(s) wrong`,
)

/* ------------------------------------------------------------------ *
 * Landing matrix: one email, one role
 * ------------------------------------------------------------------ */

console.log("\n--- POST-LOGIN LANDING: four roles, with and without ?next= ---\n")

// Either login page authenticates any account — the page used is irrelevant and
// there is no longer a wrong door to be refused at. What the rule decides now
// is only where a completed sign-in lands, and whether a ?next= is allowed to
// override it. Expectations are spelled out rather than derived; deriving them
// from the function under test would assert nothing.
//
// `next` here is "/search", a page every role can legitimately reach, so a case
// that honours it is honouring a real destination and not a technicality.
const landingCases = [
  // An ordinary customer is the only role ?next= applies to — they are the
  // reason it exists, arriving from a listing they clicked while signed out.
  { role: "user", noNext: "/profile", withNext: "/search" },
  // Staff and partners always land in their own account. A next= pointing
  // elsewhere is a stale deep link or an attempt to steer them out of it.
  { role: "admin", noNext: "/admin", withNext: "/admin" },
  { role: "superadmin", noNext: "/admin", withNext: "/admin" },
  { role: "channel_partner", noNext: "/partner/dashboard", withNext: "/partner/dashboard" },
]

let doorFailures = 0
let doorAssertions = 0

for (const c of landingCases) {
  const lines = []

  doorAssertions++
  const bare = postLoginPath(c.role, null)
  if (bare !== c.noNext) lines.push(`no next: expected "${c.noNext}", got "${bare}"`)

  doorAssertions++
  const withNext = postLoginPath(c.role, "/search")
  if (withNext !== c.withNext) lines.push(`with next=/search: expected "${c.withNext}", got "${withNext}"`)

  // The role's own home must agree with where it lands when nothing overrides.
  doorAssertions++
  if (landingPathForRole(c.role) !== c.noNext) {
    lines.push(`landingPathForRole disagrees: "${landingPathForRole(c.role)}" vs "${c.noNext}"`)
  }

  const ok = lines.length === 0
  if (!ok) doorFailures++
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${c.role.padEnd(15)} -> ${c.noNext.padEnd(20)} (next=/search -> ${c.withNext})`,
  )
  for (const l of lines) console.log(`        ${l}`)
}

// An unreadable profile must behave like an ordinary customer rather than
// throwing or landing somebody in a panel they have no role for.
doorAssertions++
{
  const got = postLoginPath(null, null)
  const ok = got === "/profile"
  if (!ok) doorFailures++
  console.log(`${ok ? "PASS" : "FAIL"}  null role falls back to /profile (got "${got}")`)
}

// The vocabulary itself: if a fifth role is added, this matrix stops being
// exhaustive and the omission should fail loudly rather than pass quietly.
doorAssertions++
const untested = ROLES.filter((r) => !landingCases.some((c) => c.role === r))
if (untested.length > 0) {
  doorFailures++
  console.log(`FAIL  roles in ROLES with no landing case: ${untested.join(", ")}`)
} else {
  console.log(`PASS  all ${ROLES.length} roles in ROLES have a landing case`)
}

// The door model is gone on purpose (2026-09-07, client instruction: the place
// of login must not matter). Assert its absence, so it cannot be reintroduced
// by a revert or a stale branch without this failing.
for (const file of ["components/auth-view.tsx", "app/auth/callback/route.ts", "lib/auth/landing.ts"]) {
  doorAssertions++
  const src = readFileSync(file, "utf8")
  const ok = !src.includes("roleAllowedAtDoor") && !src.includes("wrongDoorMessage")
  if (!ok) doorFailures++
  console.log(`${ok ? "PASS" : "FAIL"}  ${file} carries no door check`)
}

console.log(`\n${doorAssertions} assertions across ${landingCases.length} roles`)
console.log(
  doorFailures === 0
    ? "RESULT: PASS — post-login landing correct"
    : `RESULT: FAIL — ${doorFailures} landing case(s) wrong`,
)


// ---------------------------------------------------------------------------
// 3. PARTNER DATA ISOLATION — W6.7
//
// Commission money is a new leak surface, and a worse one than the listing gate:
// a partner seeing another partner's earnings is a breach of both parties'
// commercial confidence. The listing matrix above tests pure functions; this
// tests the database, because that is what actually stands between two
// partners.
//
// Every row here is created inside a transaction and rolled back. Nothing
// written by this file survives it.
//
// This is a SEPARATE tally on purpose — do not fold it into the 49 or the 23.
// ---------------------------------------------------------------------------

const { Client } = await import("pg")
const pg = new Client({ connectionString: process.env.DIRECT_URL })
await pg.connect()

let partnerAssertions = 0
let partnerFailures = 0
const partnerOk = (cond, msg, detail = "") => {
  partnerAssertions++
  if (cond) {
    console.log("PASS  " + msg)
  } else {
    partnerFailures++
    console.log("FAIL  " + msg + (detail ? "  <- " + detail : ""))
  }
}

console.log("\n=== PARTNER DATA ISOLATION ===")

const people = (await pg.query('select id from public.profiles order by "createdAt" limit 2')).rows

// Needs two real profiles to prove one partner cannot see the other's money.
// After scripts/clear-users.mjs there is only the superadmin, so say so plainly
// rather than crashing on people[1] — a skipped check that announces itself is
// recoverable; one that looks like a pass is not.
if (people.length < 2) {
  console.log(
    `SKIP  partner isolation needs 2 profiles, found ${people.length}.` +
      " Sign up a second account and re-run — this section did NOT pass, it did not run.",
  )
  await pg.end()
  process.exit(failures + doorFailures === 0 ? 0 : 1)
}

const [A, B] = [people[0].id, people[1].id]

await pg.query("begin")
try {
  // Two partners, each with a referral, a commission and a payout.
  const ids = {}
  for (const [name, owner] of [["a", A], ["b", B]]) {
    ids[name] = { referral: crypto.randomUUID(), commission: crypto.randomUUID(), payout: crypto.randomUUID() }
    await pg.query(
      'insert into public.partner_referrals (id, "partnerId", "refCode", "referredProfileId", "landedAt") values ($1,$2,$3,$4, now())',
      [ids[name].referral, owner, "TEST" + name.toUpperCase(), owner === A ? B : A],
    )
    await pg.query(
      'insert into public.partner_commissions (id, "partnerId", "referralId", "sourceType", "grossAmount", "ratePct", "commissionAmount") values ($1,$2,$3,\'annual_subscription\',1000,10,100)',
      [ids[name].commission, owner, ids[name].referral],
    )
    await pg.query(
      'insert into public.partner_payouts (id, "partnerId", "periodStart", "periodEnd", "totalAmount") values ($1,$2, now(), now(), 100)',
      [ids[name].payout, owner],
    )
  }

  // Read as partner A, exactly as PostgREST would.
  const asPartner = async (userId, sql) => {
    await pg.query("savepoint role_probe")
    try {
      await pg.query("set local role authenticated")
      await pg.query(`set local request.jwt.claims = '${JSON.stringify({ sub: userId, role: "authenticated" })}'`)
      const res = await pg.query(sql)
      await pg.query("set local role postgres")
      await pg.query("rollback to savepoint role_probe")
      return { rows: res.rows }
    } catch (err) {
      await pg.query("rollback to savepoint role_probe")
      return { error: err.message }
    }
  }

  for (const table of ["partner_referrals", "partner_commissions", "partner_payouts"]) {
    const own = await asPartner(A, `select "partnerId" from public.${table}`)
    const rows = own.rows ?? []
    partnerOk(!own.error && rows.length > 0, `partner A can read their own ${table}`, own.error)
    partnerOk(
      rows.every((r) => r.partnerId === A),
      `partner A sees NOTHING belonging to partner B in ${table}`,
      own.error ?? `saw ${rows.filter((r) => r.partnerId !== A).length} foreign row(s)`,
    )
  }

  // A partner must not be able to write their own money.
  const forgeCommission = await asPartner(
    A,
    `insert into public.partner_commissions (id, "partnerId", "sourceType", "grossAmount", "ratePct", "commissionAmount") values ('${crypto.randomUUID()}', '${A}', 'annual_subscription', 100000, 50, 50000)`,
  )
  partnerOk(!!forgeCommission.error, "partner A CANNOT write themselves a commission", "the insert succeeded")

  const approveOwn = await asPartner(A, `update public.partner_commissions set status = 'approved'`)
  partnerOk(!!approveOwn.error, "partner A CANNOT approve their own commission")

  const forgePayout = await asPartner(
    A,
    `insert into public.partner_payouts (id, "partnerId", "periodStart", "periodEnd", "totalAmount") values ('${crypto.randomUUID()}', '${A}', now(), now(), 99999)`,
  )
  partnerOk(!!forgePayout.error, "partner A CANNOT invent a payout")

  const claimReferral = await asPartner(A, `update public.partner_referrals set "partnerId" = '${A}'`)
  partnerOk(!!claimReferral.error, "partner A CANNOT reassign someone else's referral to themselves")

  // Anonymous visitors have no business here at all.
  const asAnon = async (sql) => {
    await pg.query("savepoint anon_probe")
    try {
      await pg.query("set local role anon")
      const res = await pg.query(sql)
      await pg.query("set local role postgres")
      await pg.query("rollback to savepoint anon_probe")
      return { rows: res.rows }
    } catch (err) {
      await pg.query("rollback to savepoint anon_probe")
      return { error: err.message }
    }
  }
  for (const table of ["partner_referrals", "partner_commissions", "partner_payouts"]) {
    const res = await asAnon(`select * from public.${table} limit 1`)
    partnerOk(!!res.error, `anon CANNOT read ${table}`)
  }
} finally {
  await pg.query("rollback")
  await pg.end()
}

// A commission that never accrues is the same as no commission model at all,
// and the accrual is a side effect of the two grant actions rather than
// anything a pure function can be asked about. Assert it at the call sites.
for (const fn of ["grantSubscription", "grantServicePackage"]) {
  const src = readFileSync("app/actions/admin-sales.ts", "utf8")
  const at = src.indexOf(`export async function ${fn}(`)
  const body = at === -1 ? "" : src.slice(at, at + 3000)
  partnerOk(
    body.includes("accrueCommissionForPurchase("),
    `${fn}() accrues a partner commission`,
    "the grant does not call accrueCommissionForPurchase",
  )
}

console.log(`\n${partnerAssertions} assertions across partner data isolation`)
console.log(
  partnerFailures === 0
    ? "RESULT: PASS — partner data is isolated"
    : `RESULT: FAIL — ${partnerFailures} isolation case(s) wrong`,
)

process.exit(failures === 0 && doorFailures === 0 && partnerFailures === 0 ? 0 : 1)
