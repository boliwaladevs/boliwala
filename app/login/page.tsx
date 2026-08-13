import { AuthView } from "@/components/auth-view"
import { getSiteStats } from "@/lib/data/stats"
import { pageMetadata } from "@/lib/seo"

// Statistics on this page come from live data, so it revalidates rather than
// baking counts in at build time. Matches app/sitemap.ts.
export const revalidate = 3600

export const metadata = pageMetadata({
  title: "Log In",
  description: "Log in to your Boliwala account to unlock property details, save shortlists, and manage alerts.",
  path: "/login",
  noIndex: true,
})

export default async function LoginPage() {
  const stats = await getSiteStats()

  return (
    <main>
      <AuthView defaultTab="login" stats={stats} />
    </main>
  )
}
