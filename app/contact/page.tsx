import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactForm } from "@/components/contact-form"
import { createClient } from "@/lib/supabase/server"
import type { SalesEnquiryPlan } from "@/app/actions/contact-sales"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Request a free consultation about any bank auction property. Tell us what you are looking for and our team will call you back.",
  path: "/contact",
})

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; plan?: string }>
}) {
  const { listing: listingSlug, plan: planParam } = await searchParams

  // `?plan=` turns this page into a sales enquiry. Anything unrecognised falls
  // through to the ordinary callback form rather than erroring — a mistyped
  // link should still let someone reach us.
  const plan: SalesEnquiryPlan | undefined =
    planParam === "annual" ? "annual_subscription" : planParam === "service" ? "service_package" : undefined

  let listingId: string | undefined
  let listingTitle: string | undefined

  if (listingSlug) {
    const supabase = await createClient()
    const { data } = await supabase.from("listings").select("id, title").eq("slug", listingSlug).eq("status", "live").maybeSingle()
    if (data) {
      listingId = data.id
      listingTitle = data.title
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6 max-w-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
              {plan ? "Talk to Sales" : "Talk to Our Team"}
            </h1>
            <p className="text-muted-foreground">
              {plan
                ? "Tell us how to reach you and our team will call within 24 hours to confirm the details and activate your plan."
                : "Have a question about an auction, our services, or how Boliwala works? Leave your number and we'll call you back."}
            </p>
          </div>
          <ContactForm source={listingId ? "listing" : "contact"} listingId={listingId} listingTitle={listingTitle} plan={plan} />
        </div>
      </div>
      <Footer />
    </main>
  )
}
