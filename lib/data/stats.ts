import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"
import type { SiteStats } from "@/lib/stats"

/**
 * Headline figures for the marketing surfaces.
 *
 * These were hardcoded in three places — hero.tsx ("12,400+ Live Auctions",
 * "140+ Cities", "18+ Banks"), auth-view.tsx ("40+ banks", "12,400+") and
 * about-view.tsx — and disagreed with each other and with reality: the
 * database holds 12 listings and 6 banks. Publishing "12,400+" is not a
 * rounding difference, and in a financial-services context an unverifiable
 * public claim carries real exposure.
 *
 * Deriving them means they are true by construction and grow on their own.
 *
 * NOT included here on purpose: "₹2,100Cr won", "840+ auctions completed" and
 * "28% average saving" from about-view.tsx. Nothing in the schema records
 * auction outcomes, so those cannot be computed and still need client sign-off
 * or removal (blocker C5/B4).
 */
export type { SiteStats } from "@/lib/stats"
export { displayCount } from "@/lib/stats"

export const getSiteStats = cache(async (): Promise<SiteStats> => {
  // Admin client: these are aggregate counts over public data, and using the
  // cookie-bound client would make every marketing page dynamic per request.
  const supabase = createAdminClient()

  const [{ count: liveAuctions }, { data: rows }, { count: banks }] = await Promise.all([
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
    supabase.from("listings").select('city, "reservePrice", "estimatedMarketValue"').eq("status", "live"),
    supabase.from("banks").select("id", { count: "exact", head: true }).eq("isActive", true),
  ])

  const listings = rows ?? []
  const cities = new Set(listings.map((r) => r.city).filter(Boolean)).size

  const discounts = listings
    .filter((r) => r.estimatedMarketValue && r.estimatedMarketValue > 0 && r.reservePrice)
    .map((r) => (1 - r.reservePrice / r.estimatedMarketValue) * 100)
    .filter((d) => d > 0 && d < 100)

  return {
    liveAuctions: liveAuctions ?? 0,
    cities,
    banks: banks ?? 0,
    avgDiscountPct:
      discounts.length >= 5
        ? Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
        : null,
  }
})
