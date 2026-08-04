// One-off SQL migration runner against DIRECT_URL (session-mode pooler).
// No ORM in this codebase — this is the stand-in until the Supabase MCP
// server or CLI is wired up for migrations.
//
//   node scripts/apply-sql.mjs supabase/migrations/<file>.sql

import { readFileSync } from "node:fs"
import { Client } from "pg"

const file = process.argv[2]
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <path-to-sql-file>")
  process.exit(1)
}

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^"(.*)"$/, "$1")
}

const sql = readFileSync(file, "utf8")
const client = new Client({ connectionString: process.env.DIRECT_URL })

try {
  await client.connect()
  await client.query(sql)
  console.log(`Applied ${file}`)
} catch (err) {
  console.error(`Failed applying ${file}:`, err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
