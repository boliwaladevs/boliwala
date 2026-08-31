// Two matrices:
//
//   1. The four-state listing gating matrix — the decision table the revenue
//      model turns on. Baseline: 49 assertions, all passing.
//   2. The four-role x two-login-door matrix — "one email, one role", added
//      2026-08-31 (MEMORY.md §37.2 Item A).
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
import {
  ROLES,
  landingPathForRole,
  loginPathForDoor,
  roleAllowedAtDoor,
  wrongDoorMessage,
} from "../lib/auth/landing.ts"

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
 * Login-door matrix: one email, one role
 * ------------------------------------------------------------------ */

console.log("\n--- LOGIN DOORS: four roles × two doors ---\n")

// Every role, at every door, with the expected verdict spelled out rather than
// derived — deriving it from the same function under test would assert nothing.
const doorCases = [
  { door: "customer", role: "user", allowed: true, lands: "/profile" },
  { door: "customer", role: "admin", allowed: true, lands: "/admin" },
  { door: "customer", role: "superadmin", allowed: true, lands: "/admin" },
  { door: "customer", role: "channel_partner", allowed: false },
  { door: "partner", role: "channel_partner", allowed: true, lands: "/partner/dashboard" },
  { door: "partner", role: "user", allowed: false },
  { door: "partner", role: "admin", allowed: false },
  { door: "partner", role: "superadmin", allowed: false },
]

let doorFailures = 0
let doorAssertions = 0

for (const c of doorCases) {
  const lines = []

  const allowed = roleAllowedAtDoor(c.door, c.role)
  doorAssertions++
  if (allowed !== c.allowed) {
    lines.push(`expected allowed=${c.allowed}, got ${allowed}`)
  }

  if (c.allowed) {
    // An admitted role must land on its own surface, not a shared default.
    const landing = landingPathForRole(c.role)
    doorAssertions++
    if (landing !== c.lands) {
      lines.push(`landing: expected "${c.lands}", got "${landing}"`)
    }
  } else {
    // A refused role must be told which door is actually theirs, and the
    // message must not name the door it was just turned away from.
    const message = wrongDoorMessage(c.door)
    const otherDoor = loginPathForDoor(c.door === "partner" ? "customer" : "partner")
    doorAssertions++
    if (!message.includes(otherDoor)) {
      lines.push(`message does not name ${otherDoor}: "${message}"`)
    }
    doorAssertions++
    // Strip the other door out first: "/partner/login" contains "/login", so a
    // naive substring test reports the customer message as naming its own door.
    const beyondOtherDoor = message.split(otherDoor).join("")
    if (beyondOtherDoor.includes(loginPathForDoor(c.door))) {
      lines.push(`message names the door it refused: "${message}"`)
    }
  }

  const ok = lines.length === 0
  if (!ok) doorFailures++
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${c.role.padEnd(15)} at ${loginPathForDoor(c.door).padEnd(15)} -> ${
      c.allowed ? `admitted, lands ${c.lands}` : "refused"
    }`,
  )
  for (const l of lines) console.log(`        ${l}`)
}

// The vocabulary itself: if a fifth role is added, this matrix stops being
// exhaustive and the omission should fail loudly rather than pass quietly.
doorAssertions++
const untested = ROLES.filter((r) => !doorCases.some((c) => c.role === r))
if (untested.length > 0) {
  doorFailures++
  console.log(`FAIL  roles in ROLES with no door case: ${untested.join(", ")}`)
} else {
  console.log(`PASS  all ${ROLES.length} roles in ROLES are covered at both doors`)
}

// "Every wrong-door case must end signed out" is a runtime behaviour of the two
// call sites, not of the pure rule above. Assert it where it lives: both
// refusal branches must sign the session back out. A valid session left behind
// under an error message is a half-open door.
const GUARD = "roleAllowedAtDoor(door, profile?.role)"
for (const file of ["components/auth-view.tsx", "app/auth/callback/route.ts"]) {
  doorAssertions++
  const src = readFileSync(file, "utf8")
  const at = src.indexOf("!" + GUARD)
  // The refusal branch, taken as the block following the guard.
  const branch = at === -1 ? "" : src.slice(at, at + 900)
  const ok = at !== -1 && branch.includes("signOut()")
  if (!ok) doorFailures++
  console.log(`${ok ? "PASS" : "FAIL"}  ${file} signs the session out on a wrong-door login`)
}

console.log(`\n${doorAssertions} assertions across ${doorCases.length} role/door pairs`)
console.log(
  doorFailures === 0
    ? "RESULT: PASS — login doors correct"
    : `RESULT: FAIL — ${doorFailures} door case(s) wrong`,
)

process.exit(failures === 0 && doorFailures === 0 ? 0 : 1)
