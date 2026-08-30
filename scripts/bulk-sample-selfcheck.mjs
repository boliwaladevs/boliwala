// Round-trip self-check for the bulk-upload sample CSV.
//   node scripts/bulk-sample-selfcheck.mjs        (run from the project root)
//
// Generates the sample exactly as the "Download sample CSV" button does — TARGET_FIELDS,
// SAMPLE_VALUES, csvEscape and isoInDays are read straight out of the component so the two
// cannot drift — then feeds it back through the importer's read + validate path and asserts
// the rows come back with no errors AND the values intact.
//
// The second half matters more than the first: before cellDates was passed to XLSX.read,
// this file round-tripped with zero row errors while every auction date came back as the
// year 46294. Zero row errors alone does not prove the sample and the parser agree.
import fs from "node:fs"
import * as XLSX from "xlsx"

const src = fs.readFileSync("components/admin/bulk-upload-panel.tsx", "utf8")

// --- pull the generation pieces VERBATIM out of the component, so the CSV built here
// --- is byte-identical to the one the button produces.
const between = (startRe, endTok) => {
  const m = src.match(startRe)
  if (!m) throw new Error("could not extract: " + startRe)
  const from = m.index + m[0].length
  const to = src.indexOf(endTok, from)
  if (to < 0) throw new Error("no terminator for " + startRe)
  return src.slice(from, to)
}
const TARGET_FIELDS = eval("([" + between(/const TARGET_FIELDS:[^=]+= \[/, "\n]") + "])")
const SAMPLE_VALUES = eval("({" + between(/const SAMPLE_VALUES:[^=]+= \{/, "\n}") + "})")
const csvEscape = eval("(" + src.match(/const csvEscape = (\(v: string\) => [^\n]+)/)[1].replace(": string", "") + ")")
const isoInDays = eval("(" + src.match(/const isoInDays = (\(days: number\) => [^\n]+)/)[1].replace(": number", "") + ")")
const guessColumn = eval("(" + src.match(/function guessColumn[\s\S]*?\n\}/)[0]
  .replace(/headers: string\[\], fieldKey: string, fieldLabel: string\): string/, "headers, fieldKey, fieldLabel)")
  .replace("(s: string)", "(s)") + ")")

// --- the real bank list from the live DB (names only), as the prop would supply
// Fixture only — the six banks live in the DB on 2026-08-31. The shipped button fills this
// column from the `banks` prop, so what is checked here is the format, not the bank list.
// Override with BANKS_JSON if the real list has moved on.
const banks = JSON.parse(process.env.BANKS_JSON ?? JSON.stringify(
  ["Bank of Baroda","Canara Bank","IDBI Bank","Punjab National Bank","State Bank of India","Union Bank of India"]
    .map((name, i) => ({ id: String(i), name }))))

// --- downloadSample(), reproduced step for step
const bankFor = (i) => (banks.length > 0 ? banks[i % banks.length].name : "")
const values = {
  ...SAMPLE_VALUES,
  bankId: [bankFor(0), bankFor(1), bankFor(2)],
  auctionDate: [isoInDays(30), isoInDays(45), isoInDays(60)],
  emdDeadline: [isoInDays(23), isoInDays(38), isoInDays(53)],
}
const lines = [TARGET_FIELDS.map((f) => csvEscape(f.label)).join(",")]
for (let i = 0; i < 3; i++) lines.push(TARGET_FIELDS.map((f) => csvEscape(values[f.key]?.[i] ?? "")).join(","))
const csv = "\uFEFF" + lines.join("\r\n")

console.log("=== GENERATED SAMPLE ===")
console.log(csv.replace("\uFEFF", ""))

// --- now push it back through handleFile() + buildPreview() (validation mirrored from source)
const buf = new TextEncoder().encode(csv)
const workbook = XLSX.read(buf, { type: "array", cellDates: true })
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
const detectedHeaders = Object.keys(rawRows[0])
const mapping = {}
for (const f of TARGET_FIELDS) mapping[f.key] = guessColumn(detectedHeaders, f.key, f.label)

const findBank = (name) => {
  const n = name.trim().toLowerCase()
  return banks.find((b) => b.name.toLowerCase() === n || b.name.toLowerCase().includes(n) || n.includes(b.name.toLowerCase()))?.id
}

let fail = 0
const bad = (m) => { console.log("  ✗ " + m); fail++ }

console.log("\n=== COLUMN AUTO-MAPPING ===")
for (const f of TARGET_FIELDS) {
  if (!mapping[f.key]) bad(`${f.label} did not auto-map`)
}
console.log(fail === 0 ? `  ✓ all ${TARGET_FIELDS.length} columns auto-mapped` : "")

console.log("\n=== ROW PARSE ===")
const parsedOut = []
rawRows.forEach((raw, i) => {
  const errors = []
  const get = (key) => { const c = mapping[key]; return c ? String(raw[c] ?? "").trim() : "" }
  const bankName = get("bankId")
  const bankId = bankName ? findBank(bankName) : undefined
  if (bankName && !bankId) errors.push(`Bank "${bankName}" not recognized`)
  else if (!bankName) errors.push("Bank column not mapped or empty")
  const reservePrice = Number(get("reservePrice"))
  const emdAmount = Number(get("emdAmount"))
  const adRaw = get("auctionDate"), edRaw = get("emdDeadline")
  const auctionDate = adRaw && !isNaN(Date.parse(adRaw)) ? new Date(adRaw).toISOString() : ""
  const emdDeadline = edRaw && !isNaN(Date.parse(edRaw)) ? new Date(edRaw).toISOString() : ""
  for (const f of TARGET_FIELDS) {
    if (!f.required || f.key === "bankId") continue
    if (f.key === "reservePrice" && (!reservePrice || reservePrice <= 0)) errors.push("Missing/invalid reserve price")
    else if (f.key === "emdAmount" && (!emdAmount || emdAmount <= 0)) errors.push("Missing/invalid EMD amount")
    else if (f.key === "auctionDate" && !auctionDate) errors.push("Missing/invalid auction date")
    else if (f.key === "emdDeadline" && !emdDeadline) errors.push("Missing/invalid EMD deadline")
    else if (!["reservePrice","emdAmount","auctionDate","emdDeadline"].includes(f.key) && !get(f.key)) errors.push(`Missing ${f.label}`)
  }
  const propertyType = get("propertyType").toLowerCase() || "residential"
  const possessionType = get("possessionType").toLowerCase() || "physical"
  parsedOut.push({ row: i + 2, errors, auctionDate, emdDeadline, propertyType, possessionType,
                   areaSqft: get("areaSqft") ? Number(get("areaSqft")) : null, reservePrice })
  console.log(`  row ${i+2}: ${errors.length ? "ERRORS: " + errors.join("; ") : "OK"}`)
  if (errors.length) fail++
})

console.log("\n=== VALUES SURVIVED THE ROUND TRIP ===")
const PT = ["residential","commercial","industrial","agricultural","mixed_use"]
const PS = ["physical","symbolic"]
parsedOut.forEach((p, i) => {
  const wantAuction = values.auctionDate[i], wantEmd = values.emdDeadline[i]
  const gotAuction = new Date(p.auctionDate).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  const gotEmd = new Date(p.emdDeadline).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  if (gotAuction !== wantAuction) bad(`row ${p.row} auction date: wrote ${wantAuction}, parsed back ${gotAuction}`)
  if (gotEmd !== wantEmd) bad(`row ${p.row} EMD deadline: wrote ${wantEmd}, parsed back ${gotEmd}`)
  if (!PT.includes(p.propertyType)) bad(`row ${p.row} bad propertyType ${p.propertyType}`)
  if (!PS.includes(p.possessionType)) bad(`row ${p.row} bad possessionType ${p.possessionType}`)
  console.log(`  row ${p.row}: auction ${gotAuction} · emd ${gotEmd} · ${p.propertyType}/${p.possessionType} · area ${p.areaSqft} · reserve ${p.reservePrice}`)
})

console.log("\n=== HEADER/COLUMN COUNT ===")
if (detectedHeaders.length !== 14) bad(`expected 14 columns, got ${detectedHeaders.length}`)
if (rawRows.length !== 3) bad(`expected 3 rows, got ${rawRows.length}`)
console.log(`  columns=${detectedHeaders.length} rows=${rawRows.length}`)

console.log(fail === 0 ? "\n✅ SELF-CHECK PASS" : `\n❌ SELF-CHECK FAIL (${fail})`)
process.exit(fail === 0 ? 0 : 1)
