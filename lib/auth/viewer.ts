import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { FieldGroup, Viewer } from "@/lib/access/types"

/**
 * Resolves the current viewer for gating decisions, from the real Supabase
 * session (cookie-based, via lib/supabase/server). Returns null for a
 * signed-out visitor — the correct and safe default.
 *
 * `listingId` is optional: pass it only when resolving access for one
 * specific listing, since `unlockedGroups` is scoped per-listing.
 */
export async function getViewer(listingId?: string): Promise<Viewer | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("creditsBalance")
    .eq("id", user.id)
    .single()

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("userId", user.id)
    .eq("status", "active")
    .gt("expiresAt", new Date().toISOString())
    .limit(1)
    .maybeSingle()

  let unlockedGroups: FieldGroup[] = []
  if (listingId) {
    const { data: unlocks } = await supabase
      .from("unlocks")
      .select("fieldGroup")
      .eq("userId", user.id)
      .eq("listingId", listingId)
    unlockedGroups = (unlocks ?? []).map((u) => u.fieldGroup as FieldGroup)
  }

  return {
    userId: user.id,
    creditBalance: profile?.creditsBalance ?? 0,
    hasActiveSubscription: !!subscription,
    unlockedGroups,
  }
}
