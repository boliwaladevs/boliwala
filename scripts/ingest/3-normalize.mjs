// Stage 3 — extracted JSON to a loadable listing row.
//
//   node scripts/ingest/3-normalize.mjs
//
// Reads:  scripts/ingest/work/02-extracted.jsonl
// Writes: scripts/ingest/work/03-normalized.jsonl
//         scripts/ingest/work/rejects.jsonl
//
// Pure and offline — no database, no network. That makes it re-runnable for
// free while the gazetteer and the lender aliases are being tuned, which is
// most of the first week's work.

import { readJsonl, appendJsonl, parseArgs } from "./lib/io.mjs"
import { dedupeHash } from "./lib/dedupe.mjs"
import { resolveLocation } from "./lib/gazetteer.mjs"
import { canonicalLenderName, inferLenderType } from "./lib/lenders.mjs"
import { PROPERTY_TYPES, REJECTED_ASSET_CLASSES } from "./lib/schema.mjs"

const IN = "scripts/ingest/work/02-extracted.jsonl"
const OUT = "scripts/ingest/work/03-normalized.jsonl"
const REJECTS = "scripts/ingest/work/rejects.jsonl"

/**
 * Fields with no safe derivation. A listing missing any of these is not a
 * listing — it is a fragment, and publishing it would put a blank where a buyer
 * expects a number.
 *
 * EMD amount and deadline are in here on purpose rather than being defaulted.
 * EMD is conventionally 10% of the reserve price, and computing it would be
 * easy and wrong: the convention is not a rule, notices vary, and a wrong EMD
 * is money a bidder actually transfers. Rejected rows land in rejects.jsonl
 * with the source file named, so they can be filled in by hand rather than lost.
 */
const REQUIRED = ["lenderName", "addressLine", "reservePrice", "emdAmount", "auctionDate", "emdDeadline"]

/** Guards against the Excel-serial-date class of bug: 2026-09-15 read as day 46280. */
function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  const year = d.getUTCFullYear()
  if (year < 2015 || year > 2040) return null
  return d.toISOString()
}

function positive(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const args = parseArgs()
const records = await readJsonl(IN)

let kept = 0
const rejectCounts = {}
const reject = (record, reason, detail = null) => {
  rejectCounts[reason] = (rejectCounts[reason] ?? 0) + 1
  appendJsonl(REJECTS, { sourceFile: record.sourceFile, district: record.district, reason, detail })
}

// Appending would duplicate every row on a re-run, and this stage is meant to be
// re-run constantly while the gazetteer is tuned. Truncate both outputs instead.
const { writeFileSync } = await import("node:fs")
writeFileSync(OUT, "")
writeFileSync(REJECTS, "")

for (const record of records) {
  if (record.error) { reject(record, "extraction_failed", record.error); continue }
  const e = record.extracted
  if (!e) { reject(record, "no_extraction"); continue }

  // --- 1. Reject anything that is not real property -------------------------
  // MEMORY.md §D.2: vehicles and plant & machinery are descoped. A raw district
  // harvest is roughly a third of them.
  if (REJECTED_ASSET_CLASSES.includes(e.assetClass)) {
    reject(record, `not_property:${e.assetClass}`, e.assetClassReason)
    continue
  }
  if (!PROPERTY_TYPES.includes(e.assetClass)) { reject(record, "unknown_asset_class", e.assetClass); continue }

  // --- 2. Lender ------------------------------------------------------------
  const lenderName = canonicalLenderName(e.lenderName)
  const lenderType = lenderName ? inferLenderType(lenderName, e.lenderType) : null

  // --- 3. Geography ---------------------------------------------------------
  const loc = resolveLocation({
    city: e.city,
    locality: e.locality,
    district: e.district,
    addressLine: e.addressLine,
  })

  // Every source in this pipeline is filtered to Maharashtra at harvest time, so
  // the state is known even when the notice omits it. This is the one geographic
  // default taken without evidence, and it is safe only because of that filter —
  // if the harvest is ever widened past Maharashtra, this line becomes a bug.
  const state = e.state?.trim() || "Maharashtra"
  const city = loc.city?.trim() || e.city?.trim() || loc.district || null
  const locality = loc.locality?.trim() || e.locality?.trim() || city

  // --- 4. Money and dates ---------------------------------------------------
  const reservePrice = positive(e.reservePrice)
  const emdAmount = positive(e.emdAmount)
  const auctionDate = parseDate(e.auctionDate)
  const emdDeadline = parseDate(e.emdDeadline)

  const candidate = { lenderName, addressLine: e.addressLine?.trim() || null, reservePrice, emdAmount, auctionDate, emdDeadline }
  const missing = REQUIRED.filter((f) => candidate[f] === null || candidate[f] === undefined)
  if (missing.length > 0) { reject(record, "missing_required", missing.join(",")); continue }

  // --- 5. Confidence --------------------------------------------------------
  // The minimum, not the mean: a record that is certain about five fields and
  // guessing at the reserve price is a guess about the reserve price. Averaging
  // would hide exactly the case the score exists to catch.
  const scores = Object.values(e.confidence ?? {}).filter((n) => typeof n === "number")
  const extractionConfidence = scores.length > 0 ? Math.min(...scores) : 0

  // --- 6. Derived fields ----------------------------------------------------
  const areaSqft = positive(e.areaSqft)
  const title =
    e.title?.trim() ||
    [e.bedrooms ? `${e.bedrooms} BHK` : null, e.assetClass === "residential" ? "Property" : e.assetClass,
     "in", locality || city].filter(Boolean).join(" ")

  // possessionType is NOT NULL in the database and the notice often does not
  // say. Defaulting to "symbolic" is the honest direction to be wrong in:
  // symbolic means the buyer may still have to evict an occupant, so a wrong
  // "symbolic" costs a buyer a phone call, while a wrong "physical" costs them
  // a court case. Rows that took this default are flagged for review below.
  const possessionAssumed = e.possessionType === null || e.possessionType === undefined
  const possessionType = e.possessionType ?? "symbolic"

  const row = {
    sourceFile: record.sourceFile,
    sourcePortal: record.portal,
    district: loc.district,
    dedupeHash: dedupeHash({ lenderName, addressLine: candidate.addressLine, pincode: e.pincode ?? "" }),

    lenderName,
    lenderType,

    title: title.slice(0, 200),
    propertyType: e.assetClass,
    possessionType,
    addressLine: candidate.addressLine,
    locality: locality ?? "",
    city: city ?? "",
    state,
    // NOT NULL with no safe default. An empty pincode drops the row out of
    // pincode search; an invented one puts it in the wrong town.
    pincode: /^\d{6}$/.test(String(e.pincode ?? "").trim()) ? String(e.pincode).trim() : "",

    reservePrice,
    emdAmount,
    bidIncreaseAmount: positive(e.bidIncreaseAmount),
    totalOutstandingDues: positive(e.totalOutstandingDues),
    areaSqft: areaSqft ? Math.round(areaSqft) : null,
    bedrooms: Number.isInteger(e.bedrooms) ? e.bedrooms : null,

    auctionDate,
    auctionTime: e.auctionTime ?? null,
    emdDeadline,
    inspectionDatetime: parseDate(e.inspectionDatetime),
    mode: e.mode ?? "Online e-Auction",

    authorisedOfficerName: e.authorisedOfficerName ?? null,
    authorisedOfficerPhone: e.authorisedOfficerPhone ?? null,
    authorisedOfficerEmail: e.authorisedOfficerEmail ?? null,

    sourceRef: e.noticeRef ?? null,
    extractionConfidence,
    quotes: e.quotes ?? null,
    flags: [
      possessionAssumed ? "possession_assumed" : null,
      loc.district === null ? "district_unresolved" : null,
      !areaSqft ? "no_area" : null,
      /^\d{6}$/.test(String(e.pincode ?? "").trim()) ? null : "no_pincode",
    ].filter(Boolean),
  }

  appendJsonl(OUT, row)
  kept++
}

console.log(`${records.length} in -> ${kept} normalized, ${records.length - kept} rejected`)
if (Object.keys(rejectCounts).length > 0) {
  console.log("\nrejections:")
  for (const [reason, n] of Object.entries(rejectCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(5)}  ${reason}`)
  }
  console.log(`\nDetail in ${REJECTS} — 'missing_required' rows are recoverable by hand.`)
}
if (args.verbose) console.log(`\n-> ${OUT}`)
