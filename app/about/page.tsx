import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AboutView } from "@/components/about-view"
import { getSiteStats } from "@/lib/data/stats"
import { pageMetadata } from "@/lib/seo"

// Statistics on this page come from live data, so it revalidates rather than
// baking counts in at build time. Matches app/sitemap.ts.
export const revalidate = 3600

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Who we are and how we help buyers navigate SARFAESI bank auction properties across India — from due diligence to possession support.",
  path: "/about",
})

export default async function AboutPage() {
  const stats = await getSiteStats()

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <AboutView stats={stats} />
      </div>
      <Footer />
    </main>
  )
}
