// Third matrix: the database-level lock, driven as the real Postgres roles.
//
// The gating matrix and leak test both prove the *application* redacts. This
// proves the database would refuse even if the application did not — which is
// the whole point of W3 narrowing the grants to match the RLS policies.
//
// Each check runs inside a transaction as `anon` or `authenticated` with the
// JWT claims PostgREST would set, then rolls back. Nothing is left behind.
//
//   node scripts/grants-test.mjs
import { readFileSync } from "node:fs"
import { Client } from "pg"
import { randomUUID } from "node:crypto"

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].trim().replace(/^"(.*)"$/, "$1")
}

const client = new Client({ connectionString: process.env.DIRECT_URL })
await client.connect()

// A real signed-in user, and someone else's id to prove isolation.
const { rows: people } = await client.query(`select id, email from public.profiles order by "createdAt" limit 2`)
const ME = people[0].id
const OTHER = people[1].id

let pass = 0, fail = 0
const ok = (cond, msg, detail = "") => {
  if (cond) { pass++; console.log("PASS  " + msg) }
  else { fail++; console.log("FAIL  " + msg + (detail ? "  <- " + detail : "")) }
}

/** Runs `sql` as `role`, rolled back. Returns { rows } or { error }. */
async function as(role, sql, params = []) {
  await client.query("begin")
  try {
    await client.query(`set local role ${role}`)
    await client.query(`set local request.jwt.claims = '${JSON.stringify({ sub: ME, role })}'`)
    const res = await client.query(sql, params)
    await client.query("rollback")
    return { rows: res.rows, rowCount: res.rowCount }
  } catch (err) {
    await client.query("rollback")
    return { error: err.message }
  }
}

console.log("--- anon: what a signed-out visitor can do ---")
let r = await as("anon", `select id, title, "reservePrice" from public.listings where status = 'live' limit 3`)
ok(!r.error && r.rows.length === 3, "reads live listings (the public columns)", r.error)

r = await as("anon", `select "flatNumber", "authorisedOfficerPhone" from public.listings limit 1`)
ok(!!r.error && /permission denied/i.test(r.error), "CANNOT read the gated columns — the credit gate holds at the database", r.error)

r = await as("anon", `select * from public.banks limit 1`)
ok(!r.error, "reads banks", r.error)

r = await as("anon", `select key from public.settings limit 1`)
ok(!r.error, "reads settings (pricing must render for guests)", r.error)

r = await as("anon", `insert into public.callback_requests (id, name, phone, source) values ($1,'w3 test','0000000000','contact')`, [randomUUID()])
ok(!r.error, "submits a callback request", r.error)

r = await as("anon", `insert into public.contact_sales_enquiries (id, name, phone, plan) values ($1,'w3 test','0000000000','annual_subscription')`, [randomUUID()])
ok(!r.error, "submits a sales enquiry", r.error)

r = await as("anon", `insert into public.alert_subscriptions (id, email, filters) values ($1,'w3@test.invalid','{}')`, [randomUUID()])
ok(!r.error, "creates an alert from a signed-out search", r.error)

r = await as("anon", `select * from public.callback_requests limit 1`)
ok(!!r.error, "CANNOT read the callback queue back", r.error)

r = await as("anon", `select * from public.contact_sales_enquiries limit 1`)
ok(!!r.error, "CANNOT read the sales pipeline", r.error)

r = await as("anon", `select * from public.profiles limit 1`)
ok(!!r.error, "CANNOT read profiles at all", r.error)

r = await as("anon", `select * from public.payments limit 1`)
ok(!!r.error, "CANNOT read payments", r.error)

r = await as("anon", `select * from public.admin_audit_log limit 1`)
ok(!!r.error, "CANNOT read the admin audit log", r.error)

r = await as("anon", `truncate public.listings`)
ok(!!r.error, "CANNOT truncate a table", r.error)

console.log("\n--- authenticated: what a signed-in user can do ---")
r = await as("authenticated", `select id, "fullName", "creditsBalance" from public.profiles where id = '${ME}'`)
ok(!r.error && r.rows.length === 1, "reads their own profile", r.error)

r = await as("authenticated", `select id from public.profiles where id = '${OTHER}'`)
ok(!r.error && r.rows.length === 0, "sees nothing when reading someone else's profile (RLS)", r.error)

r = await as("authenticated", `update public.profiles set "fullName" = 'w3 test' where id = '${ME}'`)
ok(!r.error && r.rowCount === 1, "edits their own name / phone / city", r.error)

r = await as("authenticated", `update public.profiles set role = 'superadmin' where id = '${ME}'`)
ok(!!r.error && /permission denied/i.test(r.error), "CANNOT promote themselves to superadmin", r.error)

r = await as("authenticated", `update public.profiles set "creditsBalance" = 9999 where id = '${ME}'`)
ok(!!r.error && /permission denied/i.test(r.error), "CANNOT top up their own credits", r.error)

const listing = (await client.query(`select id from public.listings limit 1`)).rows[0].id
r = await as("authenticated", `insert into public.shortlists (id, "userId", "listingId") values ($1, '${ME}', '${listing}')`, [randomUUID()])
ok(!r.error, "shortlists a property", r.error)

r = await as("authenticated", `insert into public.shortlists (id, "userId", "listingId") values ($1, '${OTHER}', '${listing}')`, [randomUUID()])
ok(!!r.error, "CANNOT shortlist on someone else's behalf (RLS)", r.error)

r = await as("authenticated", `select * from public.subscriptions where "userId" = '${ME}'`)
ok(!r.error, "reads their own subscriptions (this is what unlocks the gate)", r.error)

r = await as("authenticated", `select * from public.credit_transactions where "userId" = '${ME}'`)
ok(!r.error, "reads their own credit history", r.error)

r = await as("authenticated", `update public.alert_subscriptions set "isActive" = false`)
ok(!r.error, "pauses an alert (isActive is the one column they may write)", r.error)

r = await as("authenticated", `update public.alert_subscriptions set email = 'hijack@test.invalid'`)
ok(!!r.error && /permission denied/i.test(r.error), "CANNOT rewrite an alert's delivery address", r.error)

r = await as("authenticated", `delete from public.alert_subscriptions`)
ok(!!r.error, "CANNOT delete alerts directly (goes through the server action)", r.error)

r = await as("authenticated", `insert into public.subscriptions (id, "userId", "expiresAt", "amountPaid") values ($1, '${ME}', now() + interval '1 year', 0)`, [randomUUID()])
ok(!!r.error, "CANNOT grant themselves a subscription", r.error)

r = await as("authenticated", `insert into public.admin_audit_log (id, "adminId", action, entity) values ($1, '${ME}', 'forged', 'profile')`, [randomUUID()])
ok(!!r.error, "CANNOT forge an audit entry", r.error)

await client.end()
console.log(`\nRESULT: ${fail === 0 ? "PASS" : "FAIL"} — ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
