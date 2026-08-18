/**
 * Where a user lands after signing in.
 *
 * Client-safe on purpose — no `server-only` import — because the login form is
 * a client component and the OAuth callback is a route handler, and both need
 * this same mapping. Keeping it a pure function means the rule lives in one
 * place instead of being duplicated on each side.
 */

export const ADMIN_ROLES = ["admin", "superadmin"] as const

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin"
}

/**
 * Staff go straight to the admin panel rather than to a customer profile page
 * they have no use for. There is no separate admin login — the account's role
 * decides where it lands.
 */
export function landingPathForRole(role: string | null | undefined): string {
  return isAdminRole(role) ? "/admin" : "/profile"
}
