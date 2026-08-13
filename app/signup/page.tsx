import { AuthView } from "@/components/auth-view"
import { getSiteStats } from "@/lib/data/stats"
import { pageMetadata } from "@/lib/seo"

// Statistics on this page come from live data, so it revalidates rather than
// baking counts in at build time. Matches app/sitemap.ts.
export const revalidate = 3600

export const metadata = pageMetadata({
  title: "Create a Free Account",
  description: "Create a free Boliwala account to unlock property details, save shortlists, and get auction alerts.",
  path: "/signup",
  noIndex: true,
})

export default async function SignupPage() {
  const stats = await getSiteStats()

  return (
    <main>
      <AuthView defaultTab="signup" stats={stats} />
    </main>
  )
}
