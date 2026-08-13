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
 * The guard is deliberately only "is signed in", matching /profile. There is
 * no partner role in the schema yet, and inventing one here would fork the
 * access model ahead of the client's decision on whether the partner portal
 * ships at all.
 */
export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return <PartnerDashboardView />
}
