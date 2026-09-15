// Stage 5 — mirror sale-notice PDFs into Supabase Storage.
//
//   node scripts/ingest/5-mirror-pdfs.mjs [--all] [--budget-mb 850] [--dry-run]
//
// Reads:  scripts/ingest/work/03-normalized.jsonl + scripts/ingest/raw/**
// Writes: the `listing-docs` bucket, and listings."noticePdfPath"
//
// ---------------------------------------------------------------------------
// Why this is rationed
// ---------------------------------------------------------------------------
// Supabase's free tier gives 1 GB of storage. A sale notice averages ~400 KB,
// so the whole bucket holds roughly 2,500 of them — against a Maharashtra
// corpus of 8,000-12,000. Mirroring everything is not an option until R2 is
// enabled (client_requirement.md 1.2a) or the project moves to Pro.
//
// So: every listing keeps "sourceUrl"/"noticeUrl" pointing at the portal and
// nothing is lost, and only the districts that will actually carry traffic get
// a local copy. When the cap is raised, re-run with --all.
//
// This is the only file that knows where the bytes live. Moving to R2 changes
// this file and nothing else.

import { readFileSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { readJsonl, parseArgs, loadEnv } from "./lib/io.mjs"

const IN = "scripts/ingest/work/03-normalized.jsonl"
const RAW = "scripts/ingest/raw"
const BUCKET = "listing-docs"

/** Where the traffic will be. Everything else links to the source until R2. */
const PRIORITY_DISTRICTS = ["Thane", "Raigad", "Pune", "Mumbai City", "Mumbai Suburban"]

const args = parseArgs()
loadEnv()

const BUDGET_BYTES = Number(args["budget-mb"] ?? 850) * 1024 * 1024
const DRY = Boolean(args["dry-run"])

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/** What the bucket already holds. Paged, because list() caps at 100 by default. */
async function bucketBytes() {
  let total = 0, count = 0, offset = 0
  for (;;) {
    const { data, error } = await db.storage.from(BUCKET).list("", { limit: 1000, offset })
    if (error) throw error
    if (!data || data.length === 0) break
    for (const f of data) total += f.metadata?.size ?? 0
    count += data.length
    if (data.length < 1000) break
    offset += data.length
  }
  return { total, count }
}

const { total: startBytes, count: startCount } = await bucketBytes()
console.log(
  `${BUCKET}: ${startCount} files, ${(startBytes / 1e6).toFixed(1)} MB used of a ${(BUDGET_BYTES / 1e6).toFixed(0)} MB budget.`,
)

let rows = await readJsonl(IN)
if (!args.all) rows = rows.filter((r) => PRIORITY_DISTRICTS.includes(r.district))
if (rows.length === 0) { console.log("Nothing to mirror."); process.exit(0) }

// Only listings that actually exist and have no mirrored copy yet.
const hashes = rows.map((r) => r.dedupeHash)
const existing = new Map()
for (let i = 0; i < hashes.length; i += 500) {
  const { data, error } = await db
    .from("listings")
    .select('id, "dedupeHash", "noticePdfPath"')
    .in("dedupeHash", hashes.slice(i, i + 500))
  if (error) throw error
  for (const row of data) existing.set(row.dedupeHash, row)
}

let used = startBytes
let uploaded = 0, skipped = 0, missing = 0, stopped = false

for (const row of rows) {
  const listing = existing.get(row.dedupeHash)
  if (!listing) { skipped++; continue }
  if (listing.noticePdfPath) { skipped++; continue }

  const file = join(RAW, row.sourceFile)
  if (!existsSync(file)) { missing++; continue }

  const size = statSync(file).size
  if (used + size > BUDGET_BYTES) {
    // Stop cleanly rather than discovering the cap partway through an
    // overnight run, with half a district mirrored and no record of where.
    stopped = true
    break
  }

  const path = `${row.dedupeHash}.pdf`
  if (!DRY) {
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, readFileSync(file), { contentType: "application/pdf", upsert: true })
    if (upErr) { console.log(`  FAIL  ${row.sourceFile}: ${upErr.message}`); continue }

    const { error: dbErr } = await db
      .from("listings")
      .update({ noticePdfPath: path, updatedAt: new Date().toISOString() })
      .eq("id", listing.id)
    if (dbErr) { console.log(`  FAIL  ${row.sourceFile} (db): ${dbErr.message}`); continue }
  }

  used += size
  uploaded++
  if (uploaded % 50 === 0) console.log(`  ${uploaded} uploaded, ${(used / 1e6).toFixed(1)} MB`)
}

console.log(`\n${uploaded} mirrored, ${skipped} already done or not loaded, ${missing} source PDFs not found.`)
console.log(`${BUCKET} now at ${(used / 1e6).toFixed(1)} MB of ${(BUDGET_BYTES / 1e6).toFixed(0)} MB.`)

if (stopped) {
  console.log("\nSTOPPED at the storage budget. Remaining listings keep their source URL and are still complete.")
  console.log("To continue: enable R2 (client_requirement.md 1.2a) or move Supabase to Pro, then re-run with --all.")
} else if (used > BUDGET_BYTES * 0.8) {
  console.log(`\nNOTE  over 80% of the budget used. Plan the move to R2 before the next district.`)
}
if (DRY) console.log("\n--dry-run: nothing uploaded.")
