import { redirect } from "next/navigation"

import { PartnerDashboardView } from "@/components/partner-dashboard-view"
import { createClient } from "@/lib/supabase/server"
import { getPartnerDashboard } from "@/lib/data/partners"
import { getCommissionSettings } from "@/lib/access/settings"
import { pageMetadata, SITE_URL } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Partner Dashboard",
  description: "Channel partner dashboard.",
  path: "/partner/dashboard",
  noIndex: true,
})

/**
 * Until Sprint 2, this page rendered to anyone — a mockup full of fabricated
 * partner earnings, served to the open internet. noindex and a robots
 * disallow keep it out of search results, which is not the same as keeping
 * people out. It is now gated on the role itself (ROADMAP.md Item 5c), and
 * `channel_partner` reaches it by signing in at /partner/login, which admits no
 * other role (lib/auth/landing.ts).
 *
 * As of W6 the figures are real. `getPartnerDashboard` is called with the id
 * from the *session*, never from anything the browser supplies, which is what
 * keeps one partner out of another's earnings — the RLS policies in 0018 are
 * the second lock behind it, asserted by the partner isolation cases in
 * scripts/access-matrix-test.mjs.
 */
export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=%2Fpartner%2Fdashboard")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, fullName, email")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "channel_partner") redirect("/profile")

  const [data, commission] = await Promise.all([getPartnerDashboard(user.id), getCommissionSettings()])

  return (
    <PartnerDashboardView
      partner={{ name: profile.fullName?.trim() || profile.email, email: profile.email }}
      data={data}
      commission={commission}
      siteUrl={SITE_URL}
    />
  )
}
