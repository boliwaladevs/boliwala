import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FAQ } from "@/components/faq"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "How bank auctions work, what EMD and reserve price mean, how credits and unlocking work, and what happens after you win a SARFAESI auction.",
  path: "/faq",
})

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1 pt-32">
        <FAQ />
      </div>
      <Footer />
    </main>
  )
}
