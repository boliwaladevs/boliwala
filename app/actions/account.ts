"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Permanently deletes the caller's own account.
 *
 * Only ever acts on the session's own user id — the id is never taken from the
 * request, so there is no shape of this call that deletes somebody else.
 *
 * Deleting the auth.users row is enough to remove everything else: migration
 * 0003 added profiles.id -> auth.users.id with ON DELETE CASCADE, and every
 * per-user table (credit_transactions, shortlists, unlocks, alert_subscriptions,
 * listing_views) hangs off profiles. Deleting the profile row directly would
 * leave the auth user behind and let them sign in to a broken account.
 *
 * Requires the service-role client: auth.admin is not reachable with an anon
 * key, by design.
 *
 * NOTE for whoever owns compliance: this closes the "no deletion path at all"
 * gap flagged against migration 0009 (PAN/Aadhaar). It is deletion, not
 * anonymised retention — if a retention obligation is later identified, this
 * is the function that has to change.
 */
export async function deleteOwnAccount(): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "not_authenticated" }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) return { error: error.message }

  // Clear the cookie session too, so the browser is not left holding a token
  // for a user that no longer exists.
  await supabase.auth.signOut()

  return { ok: true }
}
