import { AdminView } from "@/components/admin-view"
import { requireAdmin } from "@/lib/auth/admin"
import { getDashboardKpis, getAdminListings, getBanksForAdmin } from "@/lib/data/admin"

export default async function AdminPage() {
  const admin = await requireAdmin()

  const [kpis, initialListings, banks] = await Promise.all([getDashboardKpis(), getAdminListings({}), getBanksForAdmin()])

  return <AdminView adminName={admin.fullName?.trim() || admin.email} kpis={kpis} initialListings={initialListings} banks={banks} />
}
