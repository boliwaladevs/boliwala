// Reconciles the harvest ledger against what is actually on disk.
//
//   node scripts/ingest/ledger-check.mjs
//
// Two people are harvesting into one tree. The ledger says what was claimed and
// how much each portal reported; this counts the files that actually arrived.
// The gap between `expected` and `collected` is the only completeness signal
// there is — a district nobody notices is short is a district the competitor
// still owns.

import { readdirSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const RAW = "scripts/ingest/raw"
const LEDGER = "scripts/ingest/ledger.csv"

/** Minimal CSV read — the ledger is hand-edited and has no quoted commas. */
const lines = readFileSync(LEDGER, "utf8").trim().split(/\r?\n/)
const header = lines[0].split(",")
const entries = lines.slice(1).filter(Boolean).map((line) => {
  const cells = line.split(",")
  return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]))
})

/** PDFs actually present, per portal/district. */
function countPdfs(dir) {
  if (!existsSync(dir)) return 0
  let n = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += countPdfs(join(dir, entry.name))
    else if (entry.name.toLowerCase().endsWith(".pdf")) n++
  }
  return n
}

const onDisk = new Map()
if (existsSync(RAW)) {
  for (const portal of readdirSync(RAW, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    for (const district of readdirSync(join(RAW, portal.name), { withFileTypes: true }).filter((e) => e.isDirectory())) {
      onDisk.set(`${portal.name}/${district.name}`, countPdfs(join(RAW, portal.name, district.name)))
    }
  }
}

console.log("portal/district".padEnd(30) + "status".padEnd(14) + "by".padEnd(10) + "expected".padStart(9) + "on disk".padStart(9) + "  gap")
console.log("─".repeat(80))

let totalDisk = 0, flagged = 0
for (const e of entries) {
  const key = `${e.portal}/${e.district}`
  const disk = onDisk.get(key) ?? 0
  totalDisk += disk
  const expected = Number(String(e.expected).replace(/[^\d]/g, "")) || null
  const gap = expected ? expected - disk : null

  // "done" with nothing on disk, or a double-digit shortfall, is the case worth
  // a second look — it usually means a portal's paging stopped early.
  const suspect = (e.status === "done" && disk === 0) || (gap !== null && gap > 10)
  if (suspect) flagged++

  console.log(
    key.padEnd(30) +
      String(e.status).padEnd(14) +
      String(e.claimed_by || "—").padEnd(10) +
      String(expected ?? "—").padStart(9) +
      String(disk).padStart(9) +
      (gap === null ? "" : `  ${gap > 0 ? "-" + gap : "ok"}`) +
      (suspect ? "   <-- check" : ""),
  )
}

const unlisted = [...onDisk.keys()].filter((k) => !entries.some((e) => `${e.portal}/${e.district}` === k))

console.log("─".repeat(80))
console.log(`${totalDisk} PDFs on disk across ${onDisk.size} portal/district folders.`)
if (unlisted.length > 0) {
  console.log(`\n${unlisted.length} folders on disk with no ledger row — add them so the other operator can see them:`)
  for (const k of unlisted) console.log(`  ${k}  (${onDisk.get(k)} files)`)
}
if (flagged > 0) console.log(`\n${flagged} rows look short. A district marked done with no files usually means paging stopped early.`)
