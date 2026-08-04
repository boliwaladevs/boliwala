import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesView } from "@/components/services-view"
import { getPricingSettings } from "@/lib/access/settings"

export default async function ServicesPage() {
  const settings = await getPricingSettings()

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <ServicesView settings={settings} />
      </div>
      <Footer />
    </main>
  )
}
