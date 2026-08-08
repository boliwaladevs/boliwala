// Guest-visible-source leak test — the security check the whole revenue model
// rests on. Reads the real gated values for live listings with the service-role
// key, then fetches each listing page with no cookies and asserts that neither
// the gated column names nor their actual values appear anywhere in the HTML.
//
// Blurring or hiding a gated value in CSS still ships it in the payload, which
// is the classic way this model leaks — so this checks the bytes, not the UI.
//
//   node scripts/leak-test.mjs [base-url]        # default http://localhost:3000

import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^"(.*)"$/, "$1")
}

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "")

// Must stay in sync with the `gated` block of lib/access/redact.ts.
const GATED_COLUMNS = [
  "flatNumber",
  "floor",
  "inspectionDatetime",
  "inspectionNotes",
  "authorisedOfficerName",
  "authorisedOfficerPhone",
  "authorisedOfficerEmail",
  "bankContact",
]

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// Public columns are fetched too, so a gated value that merely duplicates
// public data isn't misreported as a leak — see the overlap note below.
const PUBLIC_COLUMNS = [
  "title",
  "addressLine",
  "locality",
  "city",
  "state",
  "pincode",
]

const { data: listings, error } = await admin
  .from("listings")
  .select(["slug", ...PUBLIC_COLUMNS, ...GATED_COLUMNS].join(","))
  .eq("status", "live")

if (error) {
  console.error("DB read failed:", error.message)
  process.exit(1)
}

console.log(`Testing ${listings.length} live listings against ${base}\n`)

let failures = 0
let valuesChecked = 0
const overlaps = []

for (const listing of listings) {
  const res = await fetch(`${base}/listing/${listing.slug}`, {
    headers: { "cache-control": "no-cache" },
  })
  const html = await res.text()
  const problems = []

  // Everything the page is allowed to render, concatenated. Used to tell a real
  // leak apart from a gated value that merely repeats public data.
  const publicText = PUBLIC_COLUMNS.map((c) => listing[c] ?? "").join(" | ")

  for (const column of GATED_COLUMNS) {
    // Match the serialised key (`"floor":`), not the bare word — the group id
    // `flat_floor` and the label "Flat number & floor" legitimately appear in
    // the payload, and a bare substring test flags those as leaks.
    if (html.includes(`\\"${column}\\":`) || html.includes(`"${column}":`)) {
      problems.push(`column key "${column}":`)
    }

    const value = listing[column] == null ? "" : String(listing[column]).trim()
    // Values under 3 chars (a floor of "3") match too much unrelated markup to
    // assert on; the column-key check above still covers those fields.
    if (value.length < 3) continue
    valuesChecked++
    if (!html.includes(value)) continue

    if (publicText.includes(value)) {
      // Not a leak: the same string is already public on this listing. It is
      // still a monetisation smell — a buyer spends a credit for nothing.
      overlaps.push(`${listing.slug}: ${column} ("${value}") duplicates public data`)
    } else {
      problems.push(`VALUE of ${column} ("${value}")`)
    }
  }

  // Without this the test would "pass" on an error page that contains nothing.
  const vacuous = []
  if (!html.includes(listing.title)) vacuous.push("title")
  if (!html.includes(listing.city)) vacuous.push("city")

  const ok = res.ok && problems.length === 0 && vacuous.length === 0
  if (!ok) failures++

  console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  /listing/${listing.slug}`)
  for (const p of problems) console.log(`         LEAKED: ${p}`)
  for (const v of vacuous) console.log(`         VACUOUS: public field "${v}" missing`)
}

console.log(`\nColumn-key checks: ${GATED_COLUMNS.length * listings.length}`)
console.log(`Non-empty value checks: ${valuesChecked}`)

if (overlaps.length > 0) {
  console.log(`\nNot leaks, but worth fixing in the data (${overlaps.length}):`)
  for (const o of overlaps) console.log(`  - ${o}`)
}
console.log(
  failures === 0
    ? "\nRESULT: PASS — no gated data in guest HTML"
    : `\nRESULT: FAIL — ${failures} listing(s) leaked`,
)
process.exit(failures === 0 ? 0 : 1)
