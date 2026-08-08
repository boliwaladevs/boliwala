import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AboutView } from "@/components/about-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "Who we are and how we help buyers navigate SARFAESI bank auction properties across India — from due diligence to possession support.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <AboutView />
      </div>
      <Footer />
    </main>
  )
}
