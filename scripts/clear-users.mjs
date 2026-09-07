// Clears every account except the superadmins.
//
//   node scripts/clear-users.mjs          # dry run — prints the plan, deletes nothing
//   node scripts/clear-users.mjs --yes    # actually deletes
//
// The keep-list is read from settings.superadmin_emails — the same jsonb array
// that 0013_superadmin_allowlist.sql seeds and that handle_new_user() checks at
// signup. Deliberately not a hardcoded address: if the allowlist is the thing
// that decides who is an owner, it has to be the thing that decides who
// survives this too, or the two can disagree.
//
// Deleting an auth user cascades to its profile through the FK added in
// 0003_profiles_fk_auth_users_cascade.sql, and from there to credits,
// shortlists, unlocks, alerts and the partner_* rows. Listings, lenders,
// settings, applications and enquiries are NOT touched — they do not hang off
// auth.users.
//
// Per-user failures are reported and counted rather than aborting the run: a
// foreign key somewhere without a cascade would surface exactly here, and
// knowing which rows blocked is the whole value of finding out.

import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) process.env[match[1]] ??= match[2].trim().replace(/^"(.*)"$/, "$1")
}

const commit = process.argv.includes("--yes")

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

/* ---------------------------------------------------------------- *
 * The keep-list
 * ---------------------------------------------------------------- */

const { data: setting, error: settingError } = await admin
  .from("settings")
  .select("value")
  .eq("key", "superadmin_emails")
  .maybeSingle()

if (settingError) {
  console.error("Could not read settings.superadmin_emails:", settingError.message)
  process.exit(1)
}

const keepList = Array.isArray(setting?.value) ? setting.value : []

// An empty allowlist would delete every account in the project, including the
// only way back in. That is never an intended outcome of this script.
if (keepList.length === 0) {
  console.error(
    "settings.superadmin_emails is empty or missing — refusing to run.\n" +
      "Seed it first (see supabase/migrations/0013_superadmin_allowlist.sql).",
  )
  process.exit(1)
}

const keepSet = new Set(keepList.map((e) => String(e).toLowerCase()))

console.log(`Keep-list (settings.superadmin_emails): ${[...keepSet].join(", ")}\n`)

/* ---------------------------------------------------------------- *
 * Partition every auth user
 * ---------------------------------------------------------------- */

const users = []
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
  if (error) {
    console.error("Could not list users:", error.message)
    process.exit(1)
  }
  users.push(...data.users)
  if (data.users.length < 1000) break
}

const keep = users.filter((u) => keepSet.has((u.email ?? "").toLowerCase()))
const remove = users.filter((u) => !keepSet.has((u.email ?? "").toLowerCase()))

// Roles are only read to make the printout legible — the decision above is made
// on the allowlist alone, so a superadmin whose profile row is missing or wrong
// is still kept.
const { data: profiles } = await admin.from("profiles").select("id, role")
const roleOf = new Map((profiles ?? []).map((p) => [p.id, p.role]))

const describe = (u) => `${(u.email ?? "(no email)").padEnd(38)} ${(roleOf.get(u.id) ?? "no profile").padEnd(16)} ${u.id}`

console.log(`KEEP (${keep.length}):`)
for (const u of keep) console.log("  " + describe(u))

console.log(`\nDELETE (${remove.length}):`)
for (const u of remove) console.log("  " + describe(u))

if (!commit) {
  console.log(
    `\nDRY RUN — nothing was deleted. ${remove.length} account(s) would go.\n` +
      "Re-run with --yes to commit.",
  )
  process.exit(0)
}

/* ---------------------------------------------------------------- *
 * Delete
 * ---------------------------------------------------------------- */

console.log(`\nDeleting ${remove.length} account(s)...\n`)

let deleted = 0
const failed = []

for (const u of remove) {
  const { error } = await admin.auth.admin.deleteUser(u.id)
  if (error) {
    failed.push({ user: u, message: error.message })
    console.log(`FAIL  ${u.email ?? u.id}  <- ${error.message}`)
  } else {
    deleted++
    console.log(`ok    ${u.email ?? u.id}`)
  }
}

/* ---------------------------------------------------------------- *
 * Confirm what is actually left, by re-reading rather than assuming
 * ---------------------------------------------------------------- */

const { data: survivors } = await admin.from("profiles").select("email, role").order("email")

console.log(`\n${deleted} deleted, ${failed.length} failed.`)
console.log(`\nRemaining profiles (${survivors?.length ?? 0}):`)
for (const p of survivors ?? []) console.log(`  ${(p.email ?? "").padEnd(38)} ${p.role}`)

if (failed.length > 0) {
  console.log("\nRESULT: FAIL — some accounts could not be deleted (listed above).")
  process.exit(1)
}

console.log("\nRESULT: PASS — only the allowlisted superadmin account(s) remain.")
