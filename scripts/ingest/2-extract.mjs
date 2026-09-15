// Stage 2 — notice text to structured JSON, via Claude.
//
//   node scripts/ingest/2-extract.mjs [--limit 10] [--concurrency 8] [--model claude-sonnet-5]
//
// Reads:  scripts/ingest/work/01-text.jsonl
// Writes: scripts/ingest/work/02-extracted.jsonl
//
// Always run with --limit 10 first and read the output against the PDFs before
// turning this loose on a district. The prompt is tuned by looking at what it
// got wrong, and every field it invents is a number a buyer would have acted on.

import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
import { NoticeSchema, SYSTEM_PROMPT, buildUserMessage } from "./lib/schema.mjs"
import { readJsonl, appendJsonl, doneKeys, mapConcurrent, parseArgs, loadEnv } from "./lib/io.mjs"

const IN = "scripts/ingest/work/01-text.jsonl"
const OUT = "scripts/ingest/work/02-extracted.jsonl"

/** USD per million tokens, for the run cost summary. */
const PRICING = {
  "claude-opus-5": { in: 5, out: 25 },
  "claude-sonnet-5": { in: 2, out: 10 },
  "claude-haiku-4-5": { in: 1, out: 5 },
}

const args = parseArgs()
loadEnv()

const MODEL = args.model ?? process.env.INGEST_MODEL ?? "claude-opus-5"
const CONCURRENCY = Number(args.concurrency ?? 8)

const client = new Anthropic()
const records = await readJsonl(IN)
const already = await doneKeys(OUT)

// A scan carries no text to extract from, and an unreadable PDF carries none
// either. Both are already recorded in stage 1's output as a visible backlog —
// sending them to the model would spend money to be told the page is blank.
const queue = records.filter((r) => !already.has(r.sourceFile) && !r.needsOcr && !r.error && r.text?.length > 200)
const work = args.limit ? queue.slice(0, Number(args.limit)) : queue

const skippedOcr = records.filter((r) => r.needsOcr).length
const skippedErr = records.filter((r) => r.error).length

console.log(`${records.length} notices in, ${already.size} already extracted.`)
console.log(`${skippedOcr} awaiting OCR, ${skippedErr} unreadable.`)
console.log(`Extracting ${work.length} with ${MODEL} at concurrency ${CONCURRENCY}.\n`)

const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
let ok = 0, failed = 0

/** Retries the retryable failures only; a 400 is a bug in our request, not weather. */
async function extractOne(record, attempt = 1) {
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(NoticeSchema),
      },
      messages: [
        {
          role: "user",
          content: buildUserMessage({
            text: record.text,
            sourcePortal: record.portal,
            sourceHint: record.sourceFile,
          }),
        },
      ],
    })

    usage.input += response.usage.input_tokens ?? 0
    usage.output += response.usage.output_tokens ?? 0
    usage.cacheRead += response.usage.cache_read_input_tokens ?? 0
    usage.cacheWrite += response.usage.cache_creation_input_tokens ?? 0

    if (response.stop_reason === "refusal") throw new Error(`refused: ${response.stop_details?.category}`)
    if (!response.parsed_output) throw new Error("no parsed_output returned")

    appendJsonl(OUT, {
      sourceFile: record.sourceFile,
      portal: record.portal,
      district: record.district,
      model: MODEL,
      extractedAt: new Date().toISOString(),
      extracted: response.parsed_output,
    })
    ok++
    const e = response.parsed_output
    console.log(`  ok    ${record.sourceFile} -> ${e.assetClass} ${e.reservePrice ?? "?"} ${e.city ?? "?"}`)
  } catch (err) {
    const retryable =
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.APIConnectionError ||
      (err instanceof Anthropic.APIError && err.status >= 500)

    if (retryable && attempt <= 4) {
      const wait = 2 ** attempt * 1000
      console.log(`  retry ${record.sourceFile} in ${wait}ms (${err.message})`)
      await new Promise((r) => setTimeout(r, wait))
      return extractOne(record, attempt + 1)
    }

    failed++
    appendJsonl(OUT, {
      sourceFile: record.sourceFile,
      portal: record.portal,
      district: record.district,
      error: String(err?.message ?? err),
    })
    console.log(`  FAIL  ${record.sourceFile}: ${err?.message ?? err}`)
  }
}

await mapConcurrent(work, CONCURRENCY, extractOne)

const price = PRICING[MODEL]
const cost = price
  ? ((usage.input + usage.cacheWrite * 1.25 + usage.cacheRead * 0.1) * price.in + usage.output * price.out) / 1e6
  : null

console.log(`\n${ok} extracted, ${failed} failed -> ${OUT}`)
console.log(
  `tokens: ${usage.input} in, ${usage.output} out, ${usage.cacheRead} cache read, ${usage.cacheWrite} cache write`,
)
if (cost !== null) console.log(`approx cost: $${cost.toFixed(2)} (~Rs ${Math.round(cost * 88)})`)
if (usage.cacheRead === 0 && ok > 1) {
  console.log("NOTE  no cache reads — the system prompt may be under this model's minimum cacheable prefix.")
}
