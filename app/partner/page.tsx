import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PartnerView } from "@/components/partner-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Channel Partner Programme",
  description:
    "Partner with Boliwala to bring bank auction opportunities to your clients across India. Apply to join the channel partner programme.",
  path: "/partner",
})

export default function PartnerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <PartnerView />
      </div>
      <Footer />
    </main>
  )
}
