import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ListingView } from "@/components/listing-view"
import { getListingBySlug, getSimilarListings } from "@/lib/data/listings"
import { recordListingView } from "@/lib/data/views"
import { getViewer } from "@/lib/auth/viewer"
import { getPricingSettings } from "@/lib/access/settings"
import { resolveListingAccess } from "@/lib/access/resolve"
import { redactListing } from "@/lib/access/redact"
import { createClient } from "@/lib/supabase/server"

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

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
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
