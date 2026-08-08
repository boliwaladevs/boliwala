import { PartnerDashboardView } from "@/components/partner-dashboard-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Partner Dashboard",
  description: "Channel partner dashboard.",
  path: "/partner/dashboard",
  noIndex: true,
})

export default function PartnerDashboardPage() {
  return <PartnerDashboardView />
}
