/**
 * Where a user lands after signing in, and which login door admits them.
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
 * Note there is no CHECK constraint on `profiles.role` in the database, so any
 * string can be written to it today — see `scripts/2026-08-31-profiles-role-check.sql`
 * for the migration that closes that, pending approval. Everything below
 * therefore treats an unrecognised role as "not staff, not a partner".
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
 * One email, one role: the login doors
 * ------------------------------------------------------------------ */

/**
 * The two login surfaces. `/login` is the customer door, `/partner/login` is
 * the channel-partner door. They render the same component with a different
 * `variant`, but they are not interchangeable: an account may only enter
 * through the door belonging to its role.
 *
 * The data model already guarantees one role per email — `profiles.id` is a FK
 * to `auth.users(id)`, which Supabase keys on email, and `profiles.role` is a
 * single column. What was missing is that either door authenticated any role,
 * so an admin could sign in at the partner door and vice versa.
 */
export type LoginDoor = "customer" | "partner"

/** Cookie carrying the attempted door across the Google OAuth round trip.
 *
 * Same reasoning as `NEXT_COOKIE` in `next-param.ts`: putting the door on the
 * `redirectTo` handed to Supabase would change the callback URL that Supabase
 * matches against its redirect allowlist. A cookie keeps that URL
 * byte-identical to the one already working. Short-lived; the callback clears
 * it. Only ever set for the partner door — its absence means the customer one.
 */
export const DOOR_COOKIE = "bw_door"

/** Query parameter set on a wrong-door bounce, so the door can explain itself. */
export const DENIED_PARAM = "denied"

export function loginPathForDoor(door: LoginDoor): string {
  return door === "partner" ? "/partner/login" : "/login"
}

export function doorFromCookie(raw: string | null | undefined): LoginDoor {
  return raw === "partner" ? "partner" : "customer"
}

/**
 * Whether a role may sign in at a given door.
 *
 * The partner door is strict: only an explicit `channel_partner` passes, so a
 * missing or unreadable profile row is a refusal. The customer door is
 * deliberately permissive about unknown roles — it is the default door, a
 * transient profile read failure there would lock real customers out of the
 * site, and the pages that actually matter (`/admin`, `/partner/dashboard`)
 * carry their own server-side role guards regardless. The one role the
 * customer door turns away is `channel_partner`, which has a door of its own.
 */
export function roleAllowedAtDoor(door: LoginDoor, role: string | null | undefined): boolean {
  if (door === "partner") return role === "channel_partner"
  return role !== "channel_partner"
}

/**
 * What to tell someone who reached the wrong door. Names the right one — that
 * is the only useful thing the message can do. Depends on the door alone and
 * not on the role, so it stays correct after the session has been signed out
 * and the role is no longer known.
 */
export function wrongDoorMessage(door: LoginDoor): string {
  return door === "partner"
    ? "This is the channel-partner login. Sign in at /login instead."
    : "This is the customer login. Channel partners sign in at /partner/login."
}
