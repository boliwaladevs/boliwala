// The review queue.
//
//   node scripts/ingest/qc.mjs                 # what needs a human, worst first
//   node scripts/ingest/qc.mjs --slug <slug>   # one listing in full
//   node scripts/ingest/qc.mjs --approve <slug>
//   node scripts/ingest/qc.mjs --reject <slug>
//   node scripts/ingest/qc.mjs --stats
//
// The point of this script is that a reviewer confirms a number WITHOUT opening
// the PDF. Each row prints the extracted value beside the verbatim substring the
// model read it from, so the check is a glance rather than a file hunt. That is
// the difference between a QC pass that happens and one that gets skipped at
// row 200.

import { createClient } from "@supabase/supabase-js"
import { readJsonl, parseArgs, loadEnv } from "./lib/io.mjs"

const NORMALIZED = "scripts/ingest/work/03-normalized.jsonl"

const args = parseArgs()
loadEnv()

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const rupees = (n) => (n === null || n === undefined ? "—" : `Rs ${Number(n).toLocaleString("en-IN")}`)
const day = (d) => (d ? String(d).slice(0, 10) : "—")

// Quotes are kept on disk rather than in the database — they are bulky, they are
// only ever read by this script, and a column nobody queries is a column that
// rots. Joined back by hash.
const quotesByHash = new Map((await readJsonl(NORMALIZED)).map((r) => [r.dedupeHash, r]))

if (args.approve || args.reject) {
  const slug = args.approve ?? args.reject
  const approving = Boolean(args.approve)
  const { data, error } = await db
    .from("listings")
    .update({
      status: approving ? "live" : "cancelled",
      qcStatus: approving ? "approved" : "rejected",
      lastVerifiedAt: approving ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select("slug, status")
  if (error) throw error
  if (!data?.length) { console.log(`No listing with slug ${slug}`); process.exit(1) }
  console.log(`${data[0].slug} -> ${data[0].status}`)
  process.exit(0)
}

if (args.stats) {
  const { data, error } = await db.from("listings").select('status, "qcStatus", district').not("dedupeHash", "is", null)
  if (error) throw error
  const by = (key) => {
    const counts = {}
    for (const r of data) counts[r[key] ?? "—"] = (counts[r[key] ?? "—"] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }
  console.log(`${data.length} ingested listings\n`)
  for (const [label, key] of [["status", "status"], ["qc", "qcStatus"], ["district", "district"]]) {
    console.log(label + ":")
    for (const [k, n] of by(key)) console.log(`  ${String(n).padStart(6)}  ${k}`)
    console.log("")
  }
  process.exit(0)
}

const FULL = 'slug, title, city, district, "reservePrice", "emdAmount", "areaSqft", "auctionDate", "emdDeadline", "possessionType", "extractionConfidence", "dedupeHash", "sourcePortal", status'

let query = db.from("listings").select(FULL).not("dedupeHash", "is", null)
query = args.slug ? query.eq("slug", args.slug) : query.eq("qcStatus", "needs_review")

const { data, error } = await query
  .order("extractionConfidence", { ascending: true })
  .limit(Number(args.limit ?? 25))
if (error) throw error

if (!data.length) { console.log("Review queue is empty."); process.exit(0) }

console.log(`${data.length} listings needing review, least confident first.\n`)

for (const row of data) {
  const src = quotesByHash.get(row.dedupeHash)
  const q = src?.quotes ?? {}
  const flags = src?.flags?.length ? `  [${src.flags.join(", ")}]` : ""

  console.log("─".repeat(78))
  console.log(`${row.title}`)
  console.log(`${row.slug}`)
  console.log(`${row.city ?? "?"} / ${row.district ?? "NO DISTRICT"}  ·  ${row.sourcePortal}  ·  confidence ${row.extractionConfidence}${flags}`)
  if (src?.sourceFile) console.log(`source: scripts/ingest/raw/${src.sourceFile}`)
  console.log("")
  // Extracted value on the left, what the notice actually said on the right.
  const line = (label, value, quote) =>
    console.log(`  ${label.padEnd(14)} ${String(value).padEnd(22)} ${quote ? `notice: "${quote}"` : ""}`)
  line("reserve", rupees(row.reservePrice), q.reservePrice)
  line("EMD", rupees(row.emdAmount), q.emdAmount)
  line("area", row.areaSqft ? `${row.areaSqft} sq.ft` : "—", q.areaSqft)
  line("auction", day(row.auctionDate), q.auctionDate)
  line("EMD by", day(row.emdDeadline), "")
  line("possession", row.possessionType, "")
  console.log("")
}

console.log("─".repeat(78))
console.log(`\napprove:  node scripts/ingest/qc.mjs --approve ${data[0].slug}`)
console.log(`reject:   node scripts/ingest/qc.mjs --reject  ${data[0].slug}`)
