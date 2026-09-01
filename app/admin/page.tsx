import { AdminView } from "@/components/admin-view"
import { requireAdmin } from "@/lib/auth/admin"
import {
  getDashboardKpis,
  getAdminListings,
  getLendersForAdmin,
  getCallbackRequests,
  getRecentActivity,
  getAdminSectionStats,
  getAdminUsers,
  getPartnerApplications,
  getAlertSubscribersForAdmin,
  getSalesEnquiries,
  getAdminPayments,
  getAdminPackages,
} from "@/lib/data/admin"
import { getPricingSettings, getCommissionSettings } from "@/lib/access/settings"
import { getAdminPartners, getAdminCommissions } from "@/lib/data/partners"
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
    lenders,
    initialCallbacks,
    pricingSettings,
    activity,
    sectionStats,
    users,
    partnerApplications,
    alertSubscribers,
    salesEnquiries,
    payments,
    packages,
    partners,
    commissions,
    commissionSettings,
  ] = await Promise.all([
    getDashboardKpis(),
    getAdminListings({}),
    getLendersForAdmin(),
    getCallbackRequests({}),
    getPricingSettings(),
    getRecentActivity(),
    getAdminSectionStats(),
    getAdminUsers(),
    getPartnerApplications(),
    getAlertSubscribersForAdmin(),
    getSalesEnquiries({}),
    getAdminPayments(),
    getAdminPackages(),
    getAdminPartners(),
    getAdminCommissions(),
    getCommissionSettings(),
  ])

  return (
    <AdminView
      adminName={admin.fullName?.trim() || admin.email}
      kpis={kpis}
      initialListings={initialListings}
      lenders={lenders}
      initialCallbacks={initialCallbacks}
      pricingSettings={pricingSettings}
      activity={activity}
      sectionStats={sectionStats}
      users={users}
      partnerApplications={partnerApplications}
      alertSubscribers={alertSubscribers}
      salesEnquiries={salesEnquiries}
      payments={payments}
      packages={packages}
      partners={partners}
      commissions={commissions}
      commissionSettings={commissionSettings}
    />
  )
}
