// End-to-end test for stages 3 and 4, using hand-built extraction fixtures.
//
//   node scripts/ingest/pipeline-test.mjs
//
// Covers the behaviours that are expensive to discover in production:
//   - vehicles and machinery are rejected, not filed as property
//   - a row missing an unsafe-to-derive field is rejected, not defaulted
//   - Navi Mumbai nodes resolve to the right district (Kharghar -> Raigad)
//   - the same property harvested from two portals collapses to one listing
//   - LOADING IS IDEMPOTENT: running twice leaves the row count unchanged
//   - a re-auction updates the round and carries the old reserve forward
//
// Writes real rows to the real database, then deletes exactly what it wrote.
// Cleanup runs in a finally block and is keyed on the fixtures' dedupe hashes,
// so it cannot touch a real listing.

import { writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { createClient } from "@supabase/supabase-js"
import { readJsonl, loadEnv } from "./lib/io.mjs"
import { dedupeHash } from "./lib/dedupe.mjs"

loadEnv()
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const EXTRACTED = "scripts/ingest/work/02-extracted.jsonl"
const NORMALIZED = "scripts/ingest/work/03-normalized.jsonl"
const REJECTS = "scripts/ingest/work/rejects.jsonl"

const startedAt = new Date().toISOString()
let pass = 0, fail = 0
const ok = (cond, msg, detail = "") => {
  if (cond) { pass++; console.log(`PASS  ${msg}`) }
  else { fail++; console.log(`FAIL  ${msg}${detail ? ` — ${detail}` : ""}`) }
}

const conf = (v) => ({ lenderName: v, addressLine: v, reservePrice: v, emdAmount: v, auctionDate: v, emdDeadline: v })
const quotes = { reservePrice: "Rs. 52,00,000/-", emdAmount: "Rs. 5,20,000/-", areaSqft: "67.36 sq.mtrs", auctionDate: "15/11/2026" }

const base = {
  lenderType: null, branchName: null, noticeRef: "SARFAESI/2026/114", saleUnder: "sarfaesi",
  bidIncreaseAmount: 25000, totalOutstandingDues: 6100000, areaBasis: "carpet", bedrooms: 2,
  auctionTime: "11:00", inspectionDatetime: null, mode: "Online e-Auction",
  authorisedOfficerName: "A. R. Deshmukh", authorisedOfficerPhone: "+91 98200 00000",
  authorisedOfficerEmail: "ao.kharghar@example.bank", assetClassReason: "Residential flat.",
}

function fixture(sourceFile, portal, district, extracted) {
  return { sourceFile, portal, district, model: "fixture", extractedAt: new Date().toISOString(), extracted: { ...base, ...extracted, quotes } }
}

const KHARGHAR_ADDR = "Flat No. 402, B Wing, Sunrise Residency, Plot 14, Sector 20, Kharghar, Navi Mumbai"

function writeFixtures({ reauction = false } = {}) {
  const rows = [
    // 1. Kharghar flat — Raigad district, high confidence, should go live.
    fixture("baanknet/Raigad/n1.pdf", "baanknet", "Raigad", {
      assetClass: "residential", title: "2 BHK Flat in Kharagar Sector 20", lenderName: "STATE BANK OF INDIA, KHARGHAR BRANCH",
      addressLine: KHARGHAR_ADDR, locality: "Kharghar", city: "Navi Mumbai", district: null, state: "Maharashtra", pincode: "410210",
      possessionType: "physical", areaSqft: 725,
      reservePrice: reauction ? 4680000 : 5200000,
      emdAmount: reauction ? 468000 : 520000,
      auctionDate: reauction ? "2027-02-18" : "2026-11-15",
      emdDeadline: reauction ? "2027-02-11" : "2026-11-08",
      confidence: conf(0.95),
    }),
    // 2. The SAME property from a different portal — must collapse into one row.
    fixture("ibapi/Raigad/dup.pdf", "ibapi", "Raigad", {
      assetClass: "residential", title: "Residential Flat, Kharghar", lenderName: "sbi",
      addressLine: "Flat 402, B Wing, Sunrise Residency, Plot 14, Sector 20, Kharghar, Navi Mumbai",
      locality: "Kharghar", city: "Navi Mumbai", district: null, state: "Maharashtra", pincode: "410210",
      possessionType: "physical", areaSqft: 725,
      reservePrice: reauction ? 4680000 : 5200000, emdAmount: reauction ? 468000 : 520000,
      auctionDate: reauction ? "2027-02-18" : "2026-11-15", emdDeadline: reauction ? "2027-02-11" : "2026-11-08",
      confidence: conf(0.9),
    }),
    // 3. Vashi shop — Thane district (the other half of Navi Mumbai).
    fixture("baanknet/Thane/n2.pdf", "baanknet", "Thane", {
      assetClass: "commercial", title: "Shop in Vashi", lenderName: "Saraswat Co-operative Bank Ltd., Vashi Branch",
      addressLine: "Shop No. 7, Ground Floor, Shivam Plaza, Sector 17, Vashi", locality: "Vashi", city: "Navi Mumbai",
      district: null, state: "Maharashtra", pincode: "400703", possessionType: "symbolic", areaSqft: 310,
      reservePrice: 8500000, emdAmount: 850000, auctionDate: "2026-12-02", emdDeadline: "2026-11-25", confidence: conf(0.92),
    }),
    // 4. A car — must be rejected, not filed as property.
    fixture("baanknet/Thane/car.pdf", "baanknet", "Thane", {
      assetClass: "vehicle", title: "Maruti Swift VDi 2019", lenderName: "HDFC Bank", addressLine: "Yard, Turbhe",
      locality: "Turbhe", city: "Navi Mumbai", district: null, state: "Maharashtra", pincode: "400705",
      possessionType: "physical", areaSqft: null, reservePrice: 310000, emdAmount: 31000,
      auctionDate: "2026-11-20", emdDeadline: "2026-11-14", confidence: conf(0.98),
      assetClassReason: "A motor vehicle, not immovable property.",
    }),
    // 5. Low confidence — should load as draft, not live.
    fixture("mstc/Pune/n3.pdf", "mstc", "Pune", {
      assetClass: "industrial", title: "Industrial Shed, Chakan", lenderName: "Bank of Maharashtra",
      addressLine: "Plot F-22, MIDC Phase II, Chakan, Tal. Khed", locality: "Chakan", city: "Pune", district: "Pune",
      state: "Maharashtra", pincode: "410501", possessionType: null, areaSqft: 12500,
      reservePrice: 24500000, emdAmount: 2450000, auctionDate: "2026-12-10", emdDeadline: "2026-12-03",
      confidence: { ...conf(0.9), reservePrice: 0.45 },
    }),
    // 6. Missing EMD — must be rejected rather than defaulted to a computed 10%.
    fixture("mstc/Nashik/n4.pdf", "mstc", "Nashik", {
      assetClass: "residential", title: "Row House, Nashik", lenderName: "Canara Bank",
      addressLine: "Row House 9, Green Meadows, Gangapur Road, Nashik", locality: "Gangapur Road", city: "Nashik",
      district: "Nashik", state: "Maharashtra", pincode: "422013", possessionType: "physical", areaSqft: 1450,
      reservePrice: 9200000, emdAmount: null, auctionDate: "2026-12-15", emdDeadline: "2026-12-08",
      confidence: conf(0.88),
    }),
  ]
  writeFileSync(EXTRACTED, rows.map((r) => JSON.stringify(r)).join("\n") + "\n")
}

const run = (script, extra = []) =>
  execFileSync("node", [`scripts/ingest/${script}`, ...extra], { encoding: "utf8", stdio: "pipe" })

// The hashes this test will create, computed the same way the pipeline does, so
// cleanup is exact and cannot reach a real listing.
const TEST_HASHES = [
  dedupeHash({ lenderName: "State Bank of India", addressLine: KHARGHAR_ADDR, pincode: "410210" }),
  dedupeHash({ lenderName: "Saraswat Co-operative Bank", addressLine: "Shop No. 7, Ground Floor, Shivam Plaza, Sector 17, Vashi", pincode: "400703" }),
  dedupeHash({ lenderName: "Bank of Maharashtra", addressLine: "Plot F-22, MIDC Phase II, Chakan, Tal. Khed", pincode: "410501" }),
]

try {
  // ---------------- normalize ----------------
  writeFixtures()
  console.log(run("3-normalize.mjs").trim() + "\n")

  const normalized = await readJsonl(NORMALIZED)
  const rejects = await readJsonl(REJECTS)

  ok(normalized.length === 4, "4 of 6 fixtures normalize", `got ${normalized.length}`)
  ok(rejects.some((r) => r.reason === "not_property:vehicle"), "the car is rejected as a vehicle")
  ok(
    rejects.some((r) => r.reason === "missing_required" && r.detail === "emdAmount"),
    "the missing-EMD row is rejected, not defaulted",
  )

  const kharghar = normalized.find((r) => r.sourceFile === "baanknet/Raigad/n1.pdf")
  const vashi = normalized.find((r) => r.sourceFile === "baanknet/Thane/n2.pdf")
  ok(kharghar?.district === "Raigad", "Kharghar resolves to Raigad", kharghar?.district)
  ok(vashi?.district === "Thane", "Vashi resolves to Thane", vashi?.district)
  ok(kharghar?.city === "Navi Mumbai", "city is normalised to Navi Mumbai", kharghar?.city)
  ok(kharghar?.lenderName === "State Bank of India", "branch suffix is stripped from the lender", kharghar?.lenderName)
  ok(vashi?.lenderName === "Saraswat Co-operative Bank", "co-op bank name canonicalises", vashi?.lenderName)

  const dup = normalized.find((r) => r.sourceFile === "ibapi/Raigad/dup.pdf")
  ok(dup?.dedupeHash === kharghar?.dedupeHash, "the same property from two portals shares a hash")

  const chakan = normalized.find((r) => r.sourceFile === "mstc/Pune/n3.pdf")
  ok(chakan?.possessionType === "symbolic" && chakan.flags.includes("possession_assumed"),
    "unstated possession defaults to symbolic and is flagged")
  ok(chakan?.extractionConfidence === 0.45, "confidence is the minimum, not the mean", String(chakan?.extractionConfidence))

  // ---------------- load, first pass ----------------
  console.log("\n" + run("4-load.mjs", ["--threshold", "0.85"]).trim() + "\n")

  const after1 = await db.from("listings").select("id, slug, status, district, city, \"auctionRoundNo\", \"reservePrice\", \"previousReservePrice\"").in("dedupeHash", TEST_HASHES)
  ok(after1.data?.length === 3, "3 listings created (the duplicate collapsed)", `got ${after1.data?.length}`)

  const kRow = after1.data?.find((r) => r.city === "Navi Mumbai" && r.district === "Raigad")
  ok(kRow?.status === "live", "a high-confidence row auto-publishes", kRow?.status)
  ok(after1.data?.find((r) => r.district === "Pune")?.status === "draft", "a low-confidence row is held as draft")
  ok(kRow?.auctionRoundNo === 1, "first sighting is round 1")

  // ---------------- load, second pass: IDEMPOTENCY ----------------
  console.log(run("4-load.mjs", ["--threshold", "0.85"]).trim() + "\n")
  const after2 = await db.from("listings").select("id, slug").in("dedupeHash", TEST_HASHES)
  ok(after2.data?.length === 3, "re-running the loader creates nothing new", `got ${after2.data?.length}`)
  ok(
    after2.data?.every((r) => after1.data.some((p) => p.id === r.id && p.slug === r.slug)),
    "ids and slugs are stable across runs (shortlists and URLs survive)",
  )

  // ---------------- re-auction ----------------
  writeFixtures({ reauction: true })
  run("3-normalize.mjs")
  console.log(run("4-load.mjs", ["--threshold", "0.85"]).trim() + "\n")

  const after3 = await db.from("listings").select('id, "auctionRoundNo", "reservePrice", "previousReservePrice"').in("dedupeHash", [TEST_HASHES[0]])
  const r3 = after3.data?.[0]
  ok(after3.data?.length === 1, "a re-auction does not create a second listing")
  ok(r3?.auctionRoundNo === 2, "the round number increments", String(r3?.auctionRoundNo))
  ok(Number(r3?.previousReservePrice) === 5200000, "the previous reserve is carried forward", String(r3?.previousReservePrice))
  ok(Number(r3?.reservePrice) === 4680000, "the new reserve is current", String(r3?.reservePrice))
  ok(r3?.id === kRow?.id, "the re-auction updated the same row")
} finally {
  const { error } = await db.from("listings").delete().in("dedupeHash", TEST_HASHES)
  const { error: lErr } = await db.from("lenders").delete().in("name", ["Saraswat Co-operative Bank", "Bank of Maharashtra"])
  // The loader writes a bulk_upload_batches row per invocation; this test makes
  // three. Left behind they read as real ingest runs in the admin audit trail.
  await db.from("bulk_upload_batches").delete().gte("createdAt", startedAt).eq("filename", "ingest:all")
  writeFileSync(EXTRACTED, "")
  writeFileSync(NORMALIZED, "")
  writeFileSync(REJECTS, "")
  console.log(`\ncleanup: listings ${error ? "FAILED " + error.message : "removed"}, test lenders ${lErr ? "kept (" + lErr.message + ")" : "removed"}`)
}

console.log(`\nRESULT: ${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`)
process.exitCode = fail === 0 ? 0 : 1
