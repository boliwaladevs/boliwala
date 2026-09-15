// Stage plumbing: JSONL in, JSONL out, resumable.
//
// Every stage reads one file and appends to another, keyed by `sourceFile`. A
// stage that dies at record 4,300 of 10,000 — rate limit, bad PDF, laptop lid —
// is restarted with the same command and picks up where it stopped. Nothing is
// recomputed and nothing is duplicated.
//
// Append-only rather than write-at-end is the whole point: a crash keeps
// everything already done. An extraction run that has to start over because the
// process died 3 hours in is the difference between this pipeline being usable
// and not.

import { createReadStream, existsSync, appendFileSync, mkdirSync, readFileSync } from "node:fs"
import { createInterface } from "node:readline"
import { dirname } from "node:path"

export async function readJsonl(path) {
  if (!existsSync(path)) return []
  const out = []
  const rl = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity })
  let lineNo = 0
  for await (const line of rl) {
    lineNo++
    const trimmed = line.trim()
    if (!trimmed) continue
    try {
      out.push(JSON.parse(trimmed))
    } catch {
      // A torn last line is the normal shape of a crash mid-append. Skip it
      // loudly rather than aborting a run over one truncated record.
      console.warn(`  ! ${path}:${lineNo} is not valid JSON, skipping`)
    }
  }
  return out
}

export function appendJsonl(path, record) {
  mkdirSync(dirname(path), { recursive: true })
  appendFileSync(path, JSON.stringify(record) + "\n", "utf8")
}

/** The set of `sourceFile` values already present in an output file. */
export async function doneKeys(path, key = "sourceFile") {
  return new Set((await readJsonl(path)).map((r) => r[key]))
}

/**
 * Run `worker` over `items` with bounded concurrency, in order of completion.
 *
 * Hand-rolled rather than pulled from a library: it is fifteen lines, and the
 * pipeline is meant to run on a laptop with no network at install time.
 */
export async function mapConcurrent(items, limit, worker) {
  const queue = [...items.entries()]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const [index, item] = queue.shift()
      await worker(item, index)
    }
  })
  await Promise.all(runners)
}

/** `--flag value` and `--flag=value` both work; bare `--flag` is boolean true. */
export function parseArgs(argv = process.argv.slice(2)) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue
    const [flag, inline] = argv[i].slice(2).split("=")
    if (inline !== undefined) args[flag] = inline
    else if (argv[i + 1] && !argv[i + 1].startsWith("--")) args[flag] = argv[++i]
    else args[flag] = true
  }
  return args
}

/** Loads .env.local the same way scripts/apply-sql.mjs does. */
export function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m) process.env[m[1]] ??= m[2].trim().replace(/^"(.*)"$/, "$1")
  }
}
