import { AuthView } from "@/components/auth-view"
import { getSiteStats } from "@/lib/data/stats"
import { pageMetadata } from "@/lib/seo"

// Statistics on this page come from live data, so it revalidates rather than
// baking counts in at build time. Matches app/login/page.tsx.
export const revalidate = 3600

export const metadata = pageMetadata({
  title: "Channel Partner Log In",
  description: "Log in to the Boliwala channel partner portal.",
  path: "/partner/login",
  noIndex: true,
})

// Deliberately the same component as /login — same fields, same Google button,
// same layout. Only the post-login destination differs (ROADMAP.md Item 5b).
export default async function PartnerLoginPage() {
  const stats = await getSiteStats()

  return (
    <main>
      <AuthView defaultTab="login" stats={stats} variant="partner" />
    </main>
  )
}
