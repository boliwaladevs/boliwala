// Stage 4 — normalized rows into Supabase.
//
//   node scripts/ingest/4-load.mjs [--dry-run] [--district Thane] [--threshold 0.85]
//
// Reads: scripts/ingest/work/03-normalized.jsonl
//
// Idempotent. Running it twice over the same input must leave the row count
// unchanged — that single property is what makes the harvest restartable, and
// it is the first thing to test after any change here.

import { randomUUID } from "node:crypto"
import { createClient } from "@supabase/supabase-js"
import { readJsonl, parseArgs, loadEnv } from "./lib/io.mjs"
import { inferLenderType, shortName } from "./lib/lenders.mjs"

const IN = "scripts/ingest/work/03-normalized.jsonl"
const BATCH = 500

const args = parseArgs()
loadEnv()

const THRESHOLD = Number(args.threshold ?? 0.85)
const DRY = Boolean(args["dry-run"])

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

let rows = await readJsonl(IN)
if (args.district) rows = rows.filter((r) => r.district === args.district)
if (rows.length === 0) { console.log("Nothing to load."); process.exit(0) }

// A single input file can legitimately contain the same property twice — the
// same notice harvested from two portals. Collapsing here rather than letting
// the database reject the batch keeps one bad pair from failing 499 good rows.
const byHash = new Map()
for (const r of rows) byHash.set(r.dedupeHash, r)
const deduped = [...byHash.values()]
console.log(`${rows.length} rows in, ${deduped.length} unique by hash.`)

// ---------------------------------------------------------------------------
// 1. Lenders. The table starts with 6 rows, all banks; a state-wide harvest
//    produces well over a hundred sellers. Upsert on `name`, which is already
//    UNIQUE, so re-runs are free.
// ---------------------------------------------------------------------------
const lenderNames = [...new Set(deduped.map((r) => r.lenderName))]
const { data: existingLenders, error: lenderReadErr } = await db.from("lenders").select('id, name, "shortName"')
if (lenderReadErr) throw lenderReadErr

const lenderByName = new Map(existingLenders.map((l) => [l.name, l]))
const newLenders = lenderNames
  .filter((n) => !lenderByName.has(n))
  .map((name) => ({
    id: randomUUID(),
    name,
    shortName: shortName(name),
    lenderType: inferLenderType(name),
    isActive: true,
  }))

if (newLenders.length > 0) {
  console.log(`${newLenders.length} new lenders: ${newLenders.slice(0, 6).map((l) => l.name).join(", ")}${newLenders.length > 6 ? ", …" : ""}`)
  if (!DRY) {
    const { data, error } = await db.from("lenders").upsert(newLenders, { onConflict: "name" }).select('id, name, "shortName"')
    if (error) throw error
    for (const l of data) lenderByName.set(l.name, l)
  } else {
    for (const l of newLenders) lenderByName.set(l.name, l)
  }
}

// ---------------------------------------------------------------------------
// 2. What is already in the table, so a re-auction updates its listing instead
//    of creating a second one.
// ---------------------------------------------------------------------------
const existingByHash = new Map()
for (const hashes of chunk(deduped.map((r) => r.dedupeHash), BATCH)) {
  const { data, error } = await db
    .from("listings")
    .select(
      'id, slug, "dedupeHash", "reservePrice", "auctionDate", "auctionRoundNo", "previousReservePrice", "ingestedAt", status',
    )
    .in("dedupeHash", hashes)
  if (error) throw error
  for (const row of data) existingByHash.set(row.dedupeHash, row)
}
console.log(`${existingByHash.size} of these already exist.`)

// ---------------------------------------------------------------------------
// 3. Build the payload.
// ---------------------------------------------------------------------------
const now = new Date().toISOString()
let created = 0, reauctions = 0, refreshed = 0, published = 0, held = 0

const payload = deduped.map((r) => {
  const lender = lenderByName.get(r.lenderName)
  const existing = existingByHash.get(r.dedupeHash)

  // A new auction date on a hash we already hold means the property did not
  // sell and is back at a lower reserve. This is the branch that produces
  // "4th round, 13% below the first".
  const isReauction = existing && existing.auctionDate?.slice(0, 10) !== r.auctionDate?.slice(0, 10)
  if (existing && isReauction) reauctions++
  else if (existing) refreshed++
  else created++

  const live = r.extractionConfidence >= THRESHOLD
  if (live) published++
  else held++

  return {
    // Existing rows keep their id (the PK is referenced by shortlists,
    // listing_views and unlocks) and their slug (the URL is indexed).
    id: existing?.id ?? randomUUID(),
    slug: existing?.slug ?? `${slugify(`${r.title}-${r.city}-${shortName(r.lenderName)}`)}-${r.dedupeHash.slice(0, 6)}`,
    dedupeHash: r.dedupeHash,

    title: r.title,
    propertyType: r.propertyType,
    possessionType: r.possessionType,
    // An existing live listing is not demoted to draft by a re-harvest — a
    // human may have already approved it, and this run's confidence score is
    // about the notice text, not about that decision.
    status: existing?.status === "live" ? "live" : live ? "live" : "draft",
    lenderId: lender?.id ?? null,

    addressLine: r.addressLine,
    locality: r.locality,
    city: r.city,
    district: r.district,
    state: r.state,
    pincode: r.pincode,

    reservePrice: r.reservePrice,
    emdAmount: r.emdAmount,
    bidIncreaseAmount: r.bidIncreaseAmount,
    totalOutstandingDues: r.totalOutstandingDues,
    previousReservePrice: isReauction ? existing.reservePrice : existing?.previousReservePrice ?? null,
    auctionRoundNo: isReauction ? (existing.auctionRoundNo ?? 1) + 1 : existing?.auctionRoundNo ?? 1,

    areaSqft: r.areaSqft,
    bedrooms: r.bedrooms,

    auctionDate: r.auctionDate,
    auctionTime: r.auctionTime,
    emdDeadline: r.emdDeadline,
    inspectionDatetime: r.inspectionDatetime,
    mode: r.mode,

    authorisedOfficerName: r.authorisedOfficerName,
    authorisedOfficerPhone: r.authorisedOfficerPhone,
    authorisedOfficerEmail: r.authorisedOfficerEmail,

    sourcePortal: r.sourcePortal,
    sourceRef: r.sourceRef,
    extractionConfidence: r.extractionConfidence,
    qcStatus: live ? "auto" : "needs_review",
    // Every row carries every key. A bulk upsert sends one column list for the
    // whole batch, so a key that is `undefined` on some rows is written as NULL
    // on those rows — which would blank the original ingest date on every
    // re-harvest rather than leaving it alone.
    ingestedAt: existing?.ingestedAt ?? now,
    lastVerifiedAt: now,
    // No default on this column — an insert without it fails outright.
    updatedAt: now,
    // "createdAt" and "viewCount" are deliberately absent: both have database
    // defaults, so a new row gets them, and an existing row keeps the values it
    // has. Including them would reset every re-harvested listing's age and
    // popularity to zero on each run.
  }
})

const missingLender = payload.filter((p) => !p.lenderId)
if (missingLender.length > 0) {
  console.error(`ABORT: ${missingLender.length} rows have no lender id. First: ${missingLender[0].title}`)
  process.exit(1)
}

console.log(
  `\n${created} new, ${reauctions} re-auctions, ${refreshed} re-verified.` +
    `\n${published} meet the ${THRESHOLD} confidence bar, ${held} go to the QC queue.`,
)

if (DRY) {
  console.log("\n--dry-run: nothing written.")
  console.log(JSON.stringify(payload[0], null, 2))
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 4. Write. Upsert on the hash, so this is safe to re-run.
// ---------------------------------------------------------------------------
let written = 0
const failures = []
for (const [i, batch] of chunk(payload, BATCH).entries()) {
  const { error } = await db.from("listings").upsert(batch, { onConflict: "dedupeHash" })
  if (error) {
    failures.push({ batch: i, error: error.message })
    console.error(`  batch ${i} FAILED: ${error.message}`)
  } else {
    written += batch.length
    console.log(`  batch ${i}: ${batch.length} rows`)
  }
}

// The audit table has existed since the Prisma schema and has never been
// written to. This is what it is for.
//
// "adminId" is NOT NULL with no default, and this runs as a script rather than
// as a signed-in admin — so it is attributed to a superadmin profile. If there
// isn't one, the run is still recorded on stdout and the listings are already
// written; losing the audit row is not worth failing an import over. It is
// reported rather than swallowed, which is the part that matters.
const { data: admin } = await db.from("profiles").select("id").eq("role", "superadmin").limit(1).maybeSingle()

if (!admin) {
  console.warn("WARN  no superadmin profile found — skipping the bulk_upload_batches audit row.")
} else {
  const { error: auditError } = await db.from("bulk_upload_batches").insert({
    id: randomUUID(),
    adminId: admin.id,
    filename: `ingest:${args.district ?? "all"}`,
    status: failures.length > 0 ? "failed" : "committed",
    rowCount: rows.length,
    validCount: written,
    errorCount: rows.length - written,
    errors: failures.length > 0 ? failures : null,
    createdAt: now,
    committedAt: new Date().toISOString(),
  })
  if (auditError) console.warn(`WARN  audit row not written: ${auditError.message}`)
}

console.log(`\n${written} rows written, ${failures.length} batches failed.`)
