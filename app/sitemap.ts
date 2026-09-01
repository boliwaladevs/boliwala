import type { MetadataRoute } from "next"

import { getSitemapListings } from "@/lib/data/listings"
import { absoluteUrl } from "@/lib/seo"

// Listings change when an admin publishes or edits one, so the sitemap is
// rebuilt hourly rather than pinned at build time.
export const revalidate = 3600

/**
 * Only publicly useful, indexable pages belong here. Authenticated surfaces
 * (/profile, /admin, /partner/dashboard), auth screens, and the legacy
 * /listing redirect are deliberately excluded — they are also disallowed in
 * robots.ts.
 */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/search", priority: 0.9, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/services", priority: 0.8, changeFrequency: "monthly" },
  { path: "/partner", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  let listingEntries: MetadataRoute.Sitemap = []
  try {
    const listings = await getSitemapListings()
    listingEntries = listings.map((listing) => ({
      url: absoluteUrl(`/listing/${listing.slug}`),
      lastModified: listing.updatedAt ? new Date(listing.updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.7,
    }))
  } catch {
    // A database blip must not take the whole sitemap down — serving the
    // static routes is strictly better than serving a 500 to a crawler.
  }

  return [...staticEntries, ...listingEntries]
}
