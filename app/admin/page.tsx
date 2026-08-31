import { AdminView } from "@/components/admin-view"
import { requireAdmin } from "@/lib/auth/admin"
import {
  getDashboardKpis,
  getAdminListings,
  getBanksForAdmin,
  getCallbackRequests,
  getRecentActivity,
  getAdminSectionStats,
  getAdminUsers,
  getPartnerApplications,
  getAlertSubscribersForAdmin,
} from "@/lib/data/admin"
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

  const [
    kpis,
    initialListings,
    banks,
    initialCallbacks,
    pricingSettings,
    activity,
    sectionStats,
    users,
    partnerApplications,
    alertSubscribers,
  ] = await Promise.all([
    getDashboardKpis(),
    getAdminListings({}),
    getBanksForAdmin(),
    getCallbackRequests({}),
    getPricingSettings(),
    getRecentActivity(),
    getAdminSectionStats(),
    getAdminUsers(),
    getPartnerApplications(),
    getAlertSubscribersForAdmin(),
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
      sectionStats={sectionStats}
      users={users}
      partnerApplications={partnerApplications}
      alertSubscribers={alertSubscribers}
    />
  )
}
