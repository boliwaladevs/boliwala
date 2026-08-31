import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { SearchSection } from "@/components/search-section"
import { TrustBanner } from "@/components/trust-banner"
import { Philosophy } from "@/components/philosophy"
import { AuctionsByCity } from "@/components/auctions-by-city"

import { AlertsSection } from "@/components/alerts-section"
import { CallToAction } from "@/components/call-to-action"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/server"
import { JsonLd } from "@/components/json-ld"
import { getSiteStats } from "@/lib/data/stats"
import { CONTACT } from "@/lib/contact"
import { absoluteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo"

// Title and description come from the root layout's defaults; the homepage
// only needs to declare its canonical.
export const metadata = {
  alternates: { canonical: absoluteUrl("/") },
}

// `telephone` appears only once a real number is configured (C3). No `sameAs`
// yet either — the social handles are still an open client question, and
// inventing them would publish false contact details as structured data.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  alternateName: SITE_TAGLINE,
  url: absoluteUrl("/"),
  description:
    "India's dedicated platform for SARFAESI bank auction properties, covering listings, due diligence, bidding, and possession support.",
  areaServed: { "@type": "Country", name: "India" },
  email: CONTACT.email,
  ...(CONTACT.phoneDisplay ? { telephone: CONTACT.phoneDisplay } : {}),
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: absoluteUrl("/search?location={search_term_string}"),
    },
    "query-input": "required name=search_term_string",
  },
}

export default async function Home() {
  const supabase = await createClient()
  const [{ data: lenders }, stats] = await Promise.all([
    supabase.from("lenders").select("id, name, shortName").eq("isActive", true).order("name"),
    getSiteStats(),
  ])

  return (
    <main className="min-h-screen">
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={websiteJsonLd} />
      <Header />
      <Hero stats={stats} />
      <SearchSection lenders={lenders ?? []} />
      <TrustBanner />
      <Philosophy />
      <AuctionsByCity />

      <AlertsSection />
      <CallToAction />
      <Footer />
    </main>
  )
}
