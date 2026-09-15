// Stage 1 — sale-notice PDF to plain text.
//
//   node scripts/ingest/1-text.mjs [--district Thane] [--portal baanknet]
//
// Reads:  scripts/ingest/raw/<portal>/<district>/*.pdf
// Writes: scripts/ingest/work/01-text.jsonl
//
// Portal and district come from the directory path, which is the only rule the
// harvest protocol asks an operator to follow. Filenames are free — dedupe is
// content-based, so the same notice saved by two people collapses later.

import { readdirSync, statSync, readFileSync } from "node:fs"
import { join, relative, sep } from "node:path"
import { PDFParse } from "pdf-parse"
import { appendJsonl, doneKeys, parseArgs } from "./lib/io.mjs"

const RAW = "scripts/ingest/raw"
const OUT = "scripts/ingest/work/01-text.jsonl"

/**
 * Below this many characters per page a PDF is almost certainly a scan — the
 * page carries an image of text, and pdf-parse returns only whatever stray
 * label happens to be a real text object.
 *
 * These are not dropped. They are recorded with `needsOcr: true` and skipped by
 * the extractor, so the OCR backlog is a visible number rather than a silent
 * hole in a district's coverage. Co-operative bank notices — exactly the
 * inventory the competitor does not have — are disproportionately scans.
 */
const MIN_CHARS_PER_PAGE = 120

function walkPdfs(dir) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walkPdfs(full))
    else if (entry.toLowerCase().endsWith(".pdf")) out.push(full)
  }
  return out
}

const args = parseArgs()
const files = walkPdfs(RAW)

if (files.length === 0) {
  console.log(`No PDFs under ${RAW}/.`)
  console.log("Expected layout: raw/<portal>/<district>/<anything>.pdf")
  process.exit(0)
}

const already = await doneKeys(OUT)
let ok = 0, scanned = 0, failed = 0, skipped = 0

for (const file of files) {
  const rel = relative(RAW, file).split(sep)
  const [portal, district] = rel
  const sourceFile = relative(RAW, file).split(sep).join("/")

  if (args.portal && portal !== args.portal) continue
  if (args.district && district !== args.district) continue
  if (already.has(sourceFile)) { skipped++; continue }

  let parser
  try {
    parser = new PDFParse({ data: new Uint8Array(readFileSync(file)) })
    const result = await parser.getText()
    const text = (result.text ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim()
    const pages = result.total ?? result.pages?.length ?? 1
    const needsOcr = text.length < MIN_CHARS_PER_PAGE * pages

    appendJsonl(OUT, { sourceFile, portal, district, pages, chars: text.length, needsOcr, text })
    if (needsOcr) { scanned++; console.log(`  scan  ${sourceFile} (${text.length} chars / ${pages}p)`) }
    else { ok++; console.log(`  text  ${sourceFile} (${text.length} chars / ${pages}p)`) }
  } catch (err) {
    failed++
    // Recorded, not swallowed: a PDF that cannot be opened is a gap in a
    // district's coverage and has to be visible in the output file.
    appendJsonl(OUT, { sourceFile, portal, district, error: String(err?.message ?? err), text: "" })
    console.log(`  FAIL  ${sourceFile}: ${err?.message ?? err}`)
  } finally {
    await parser?.destroy().catch(() => {})
  }
}

console.log(`\n${ok} extracted, ${scanned} need OCR, ${failed} failed, ${skipped} already done -> ${OUT}`)
if (scanned > 0) {
  console.log(`${scanned} scanned notices are recorded but not extractable as text.`)
  console.log("Run them through OCR (Tesseract, eng+mar) and re-run this stage.")
}
