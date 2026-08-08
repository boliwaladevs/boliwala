// Four-state gating matrix — the decision table the revenue model turns on.
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
process.exit(failures === 0 ? 0 : 1)
