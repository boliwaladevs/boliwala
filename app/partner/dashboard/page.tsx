import { redirect } from "next/navigation"

import { PartnerDashboardView } from "@/components/partner-dashboard-view"
import { createClient } from "@/lib/supabase/server"
import { pageMetadata } from "@/lib/seo"

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
 * people out.
 *
 * The guard used to be only "is signed in", matching /profile, on the
 * reasoning that no partner role was wired up yet. That left every ordinary
 * customer one URL away from invented commission figures, so it is now gated
 * on the role itself (ROADMAP.md Item 5c).
 *
 * `channel_partner` is a live role: one account held it as of 2026-08-31, and
 * that account now reaches this page by signing in at /partner/login, which
 * admits no other role (lib/auth/landing.ts). It is not a Postgres enum —
 * there is no CHECK constraint on profiles.role yet, see
 * scripts/2026-08-31-profiles-role-check.sql.
 *
 * The portal itself is still a mockup — show.md lists /partner/dashboard as
 * "do not open" during a client demo. The approval flow and commission logic
 * remain Item 10, gated on D8.
 */
export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login?next=%2Fpartner%2Fdashboard")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "channel_partner") redirect("/profile")

  return <PartnerDashboardView />
}
