import { AdminView } from "@/components/admin-view"
import { requireAdmin } from "@/lib/auth/admin"
import { getDashboardKpis, getAdminListings, getBanksForAdmin, getCallbackRequests, getRecentActivity } from "@/lib/data/admin"
import { getPricingSettings } from "@/lib/access/settings"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Admin",
  description: "Boliwala administration.",
  path: "/admin",
  noIndex: true,
})

export default async function AdminPage() {
  const admin = await requireAdmin()

  const [kpis, initialListings, banks, initialCallbacks, pricingSettings, activity] = await Promise.all([
    getDashboardKpis(),
    getAdminListings({}),
    getBanksForAdmin(),
    getCallbackRequests({}),
    getPricingSettings(),
    getRecentActivity(),
  ])

  return (
    <AdminView
      adminName={admin.fullName?.trim() || admin.email}
      kpis={kpis}
      initialListings={initialListings}
      banks={banks}
      initialCallbacks={initialCallbacks}
      pricingSettings={pricingSettings}
      activity={activity}
    />
  )
}
