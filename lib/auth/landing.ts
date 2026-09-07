/**
 * Where a user lands after signing in.
 *
 * Client-safe on purpose — no `server-only` import — because the login form is
 * a client component and the OAuth callback is a route handler, and both need
 * this same mapping. Keeping it a pure function means the rule lives in one
 * place instead of being duplicated on each side.
 */

export const ADMIN_ROLES = ["admin", "superadmin"] as const

/**
 * The live role vocabulary, verified against `public.profiles` on 2026-08-31.
 *
 * These four are enforced by the database, not just by convention: the column
 * is of Postgres enum type `public."Role"`, so Postgres rejects anything else.
 * (MEMORY.md §37.3 said the opposite — it checked `pg_constraint`, found no
 * CHECK, and concluded the column was unconstrained. Absence of a CHECK is not
 * absence of enforcement when the type itself is an enum. See §37.10.)
 *
 * Everything below still treats an unrecognised role as an ordinary customer,
 * because the value also arrives here from a profile row that may be missing
 * entirely.
 */
export const ROLES = ["user", "channel_partner", "admin", "superadmin"] as const
export type Role = (typeof ROLES)[number]

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin"
}

/**
 * Staff go straight to the admin panel rather than to a customer profile page
 * they have no use for; channel partners go to their own portal. There is no
 * separate admin login — the account's role decides where it lands.
 */
export function landingPathForRole(role: string | null | undefined): string {
  if (isAdminRole(role)) return "/admin"
  if (role === "channel_partner") return "/partner/dashboard"
  return "/profile"
}

/* ------------------------------------------------------------------ *
 * One email, one role
 * ------------------------------------------------------------------ */

/**
 * Where a completed sign-in lands.
 *
 * The page the sign-in started from is irrelevant. `/login` and `/partner/login`
 * are two front doors onto the same building: either will authenticate any
 * account, and the account's role alone decides which floor it opens onto. This
 * replaces the earlier "door" model, which refused an admin at the partner page
 * and a partner at the customer page — removed deliberately on the client's
 * instruction (2026-09-07), not lost in a refactor.
 *
 * `?next=` is honoured for ordinary customers only. A partner or a member of
 * staff always lands in their own account, because "one email, one role" is
 * about which account a person has, and a `next=` pointing anywhere else is
 * either a stale deep link or an attempt to steer them out of it. Guests
 * clicking a listing before signing in are the case `next=` exists for, and
 * they are all role `user`.
 *
 * A null role — a profile row that could not be read — is treated as a customer
 * rather than refused. A transient read failure must not lock real customers
 * out of the site, and the pages that actually matter (`/admin`,
 * `/partner/dashboard`, `/profile`) each carry their own server-side role guard
 * regardless of what this function returns.
 */
export function postLoginPath(role: string | null | undefined, next: string | null): string {
  if (role === "user" || role == null) return next ?? "/profile"
  return landingPathForRole(role)
}
