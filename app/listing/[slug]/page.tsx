import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListingView } from "@/components/listing-view"
import { JsonLd } from "@/components/json-ld"
import { getListingBySlug, getSimilarListings } from "@/lib/data/listings"
import { recordListingView } from "@/lib/data/views"
import { getViewer } from "@/lib/auth/viewer"
import { getPricingSettings } from "@/lib/access/settings"
import { resolveListingAccess } from "@/lib/access/resolve"
import { redactListing } from "@/lib/access/redact"
import { createClient } from "@/lib/supabase/server"
import { absoluteUrl, SITE_NAME } from "@/lib/seo"
import { formatDateLong, formatINR } from "@/lib/format"

/**
 * Listing metadata is built from PUBLIC columns only. Anything in a title,
 * description or og:image is served to crawlers and to every guest, so a gated
 * field here would leak the paid data straight into search results — the exact
 * failure the access layer exists to prevent. Keep this list in step with the
 * public half of lib/access/redact.ts.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const listing = await getListingBySlug(slug)

  if (!listing) {
    return { title: "Listing not found", robots: { index: false, follow: false } }
  }

  // Seeded titles usually already name the city ("2 BHK Flat in Kharghar, Navi
  // Mumbai"), so appending it unconditionally both reads badly and pushes the
  // title past the ~60 characters search results actually show. Add it only
  // when it is missing.
  const mentionsCity = listing.title.toLowerCase().includes(listing.city.toLowerCase())
  const title = mentionsCity ? listing.title : `${listing.title}, ${listing.city}`

  const description =
    `${listing.lender.name} auction: ${listing.title} at ${listing.locality}, ${listing.city}, ` +
    `${listing.state}. Reserve price ${formatINR(listing.reservePrice)}, EMD ${formatINR(listing.emdAmount)}. ` +
    `Auction on ${formatDateLong(listing.auctionDate)}.`

  const url = absoluteUrl(`/listing/${listing.slug}`)
  const image = listing.images[0]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      ...(image ? { images: [{ url: image, alt: listing.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const listing = await getListingBySlug(slug)
  if (!listing) notFound()

  const [viewer, settings, similar] = await Promise.all([
    getViewer(listing.id),
    getPricingSettings(),
    getSimilarListings(listing.id, listing.city),
  ])

  const isNewView = await recordListingView(listing.id, viewer?.userId ?? null)
  if (isNewView) listing.viewCount += 1

  const access = resolveListingAccess(viewer, settings)
  const safeListing = redactListing(listing, access)

  let isShortlisted = false
  if (viewer) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("shortlists")
      .select("id")
      .eq("userId", viewer.userId)
      .eq("listingId", listing.id)
      .maybeSingle()
    isShortlisted = !!data
  }

  // Built from named public fields only — never spread the listing, and never
  // read `safeListing.gated`, which holds real values for a subscriber. This
  // markup is served identically to crawlers and guests.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: safeListing.title,
    url: absoluteUrl(`/listing/${safeListing.slug}`),
    ...(safeListing.images.length > 0 ? { image: safeListing.images } : {}),
    // No `datePosted` — that means "when the listing was published", which the
    // redacted listing does not carry. The auction date is expressed as the
    // offer's validThrough below, where it actually belongs.
    address: {
      "@type": "PostalAddress",
      streetAddress: safeListing.addressLine,
      addressLocality: safeListing.locality || safeListing.city,
      addressRegion: safeListing.state,
      postalCode: safeListing.pincode,
      addressCountry: "IN",
    },
    offers: {
      "@type": "Offer",
      price: safeListing.reservePrice,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validThrough: safeListing.auctionDate,
      seller: { "@type": "Organization", name: safeListing.lender.name },
    },
    ...(safeListing.areaSqft
      ? {
          floorSize: {
            "@type": "QuantitativeValue",
            value: safeListing.areaSqft,
            unitCode: "FTK",
          },
        }
      : {}),
    ...(safeListing.bedrooms ? { numberOfBedrooms: safeListing.bedrooms } : {}),
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <JsonLd data={jsonLd} />
      <Header />
      <div className="flex-1 pt-24 md:pt-28">
        <ListingView
          listing={safeListing}
          access={{ state: access.state, creditBalance: access.creditBalance }}
          settings={settings}
          similar={similar}
          isShortlisted={isShortlisted}
          isSignedIn={!!viewer}
        />
      </div>
      <Footer />
    </main>
  )
}
