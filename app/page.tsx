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

export default async function Home() {
  const supabase = await createClient()
  const { data: banks } = await supabase
    .from("banks")
    .select("id, name, shortName")
    .eq("isActive", true)
    .order("name")

  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <SearchSection banks={banks ?? []} />
      <TrustBanner />
      <Philosophy />
      <AuctionsByCity />

      <AlertsSection />
      <CallToAction />
      <Footer />
    </main>
  )
}
