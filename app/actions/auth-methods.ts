"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export type AuthMethod = "google" | "password" | "none"

/**
 * Which provider owns an email address.
 *
 * Called only after a password login has already failed, so that "Invalid login
 * credentials" can be replaced with the real reason when the real reason is
 * "this account signs in with Google". Telling someone their password is wrong
 * when they have never had one sends them to the reset flow, which mails them a
 * link that cannot help.
 *
 * Route: profiles (by email) -> auth.admin.getUserById -> identities. PostgREST
 * cannot reach the `auth` schema and listUsers() cannot filter by email, so the
 * profiles table is the only clean way in — its id is the auth user's id
 * (0003_profiles_fk_auth_users_cascade.sql).
 *
 * SECURITY — this is an email-enumeration oracle, knowingly accepted. It
 * confirms that an address has an account and how that account signs in. It is
 * reachable only behind a failed login, and returns a three-value enum and
 * nothing else: no name, no id, no status. That is the unavoidable cost of the
 * message this is here to produce. If it ever needs narrowing, the mitigation
 * is a per-IP rate limit on this action, not a vaguer return value — a vaguer
 * one would defeat the purpose while leaking the same bit.
 */
export async function authMethodForEmail(email: string): Promise<AuthMethod> {
  const trimmed = email.trim()
  if (!trimmed) return "none"

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", trimmed)
    .maybeSingle()

  if (!profile) return "none"

  const { data, error } = await admin.auth.admin.getUserById((profile as { id: string }).id)
  if (error || !data.user) return "none"

  const identities = data.user.identities ?? []

  // A password identity wins when both are somehow present: the account can be
  // entered with a password, so "use Google instead" would be wrong advice.
  if (identities.some((i) => i.provider === "email")) return "password"
  if (identities.some((i) => i.provider === "google")) return "google"

  return "none"
}
