import "server-only"

import { randomUUID, createHash } from "node:crypto"
import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

const DEDUPE_WINDOW_MINUTES = 30

async function getIpHash(): Promise<string> {
  const h = await headers()
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"
  return createHash("sha256").update(ip).digest("hex")
}

/**
 * Records a listing view, deduped per (listing, viewer) within a time
 * window — a refresh or quick back-and-forth doesn't inflate the count.
 * Writes through the admin client: listing_views has RLS enabled with no
 * client policies, by design (see migration 0005).
 */
export async function recordListingView(listingId: string, userId: string | null): Promise<boolean> {
  const admin = createAdminClient()
  const ipHash = await getIpHash()
  const windowStart = new Date(Date.now() - DEDUPE_WINDOW_MINUTES * 60 * 1000).toISOString()

  let dedupeQuery = admin.from("listing_views").select("id").eq("listingId", listingId).gte("viewedAt", windowStart)
  dedupeQuery = userId ? dedupeQuery.eq("userId", userId) : dedupeQuery.eq("ipHash", ipHash)
  const { data: existing } = await dedupeQuery.limit(1).maybeSingle()
  if (existing) return false

  await admin.from("listing_views").insert({
    id: randomUUID(),
    listingId,
    userId,
    ipHash,
    viewedAt: new Date().toISOString(),
  })
  return true
}
