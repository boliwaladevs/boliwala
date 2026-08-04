import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Listing, ListingStatus } from "@/lib/data/types"

export interface DashboardKpis {
  activeListings: number
  revenueThisMonth: number
  callbackRequestsUnread: number
  packagePurchases: number
  registeredUsers: number
  auctionsClosed: number
  alertSubscribers: number
  successFeesPending: number
  pendingPartnerApplications: number
}

/**
 * All real, all currently accurate — the money-related figures are
 * genuinely 0 right now (no Razorpay integration yet, Sprint 3.5), not
 * placeholders. No fabricated trend percentages: there's no historical
 * baseline to compute week-over-week deltas from yet.
 */
export async function getDashboardKpis(): Promise<DashboardKpis> {
  const admin = createAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [
    activeListings,
    callbackRequestsUnread,
    packagePurchases,
    registeredUsers,
    auctionsClosed,
    alertSubscribers,
    pendingPartnerApplications,
    revenueRows,
  ] = await Promise.all([
    admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "live"),
    admin.from("callback_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("service_packages").select("id", { count: "exact", head: true }),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "closed"),
    admin.from("alert_subscriptions").select("id", { count: "exact", head: true }).eq("isActive", true),
    admin.from("channel_partner_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
    admin.from("payments").select("amount").eq("status", "paid").gte("createdAt", startOfMonth.toISOString()),
  ])

  const revenueThisMonth = (revenueRows.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0)

  return {
    activeListings: activeListings.count ?? 0,
    revenueThisMonth,
    callbackRequestsUnread: callbackRequestsUnread.count ?? 0,
    packagePurchases: packagePurchases.count ?? 0,
    registeredUsers: registeredUsers.count ?? 0,
    auctionsClosed: auctionsClosed.count ?? 0,
    alertSubscribers: alertSubscribers.count ?? 0,
    successFeesPending: 0,
    pendingPartnerApplications: pendingPartnerApplications.count ?? 0,
  }
}

export interface AdminListingRow {
  id: string
  slug: string
  title: string
  city: string
  reservePrice: number
  emdAmount: number
  auctionDate: string
  viewCount: number
  noticeUrl: string | null
  status: ListingStatus
  bank: { id: string; name: string; shortName: string }
}

export interface AdminListingFilters {
  q?: string
  bankId?: string
  status?: ListingStatus
}

const ADMIN_LISTING_COLUMNS = `
  id, slug, title, city, "reservePrice", "emdAmount", "auctionDate", "viewCount", "noticeUrl", status,
  bank:banks(id, name, "shortName")
`

function sanitizeForFilter(text: string): string {
  return text.replace(/[,()%*]/g, " ").trim()
}

/** Admin sees every status (draft/live/closed/cancelled) — the public search never does. */
export async function getAdminListings(filters: AdminListingFilters): Promise<AdminListingRow[]> {
  const admin = createAdminClient()
  let query = admin.from("listings").select(ADMIN_LISTING_COLUMNS).order("createdAt", { ascending: false })

  if (filters.status) query = query.eq("status", filters.status)
  if (filters.bankId) query = query.eq("bankId", filters.bankId)
  if (filters.q) {
    const text = sanitizeForFilter(filters.q)
    if (text) query = query.or(`title.ilike.%${text}%,city.ilike.%${text}%,slug.ilike.%${text}%`)
  }

  const { data, error } = await query.limit(200)
  if (error) throw error
  return (data ?? []) as unknown as AdminListingRow[]
}

const FULL_EDIT_COLUMNS = `
  id, slug, title, "propertyType", "possessionType", status,
  "bankId", bank:banks(id, name, "shortName"),
  "addressLine", locality, city, state, pincode,
  "reservePrice", "emdAmount", "estimatedMarketValue",
  "auctionDate", "auctionTime", mode, "emdDeadline", "bidIncreaseAmount", "totalOutstandingDues",
  "noticeUrl", "areaSqft", bedrooms, "viewCount",
  "flatNumber", floor, "inspectionDatetime", "inspectionNotes",
  "authorisedOfficerName", "authorisedOfficerPhone", "authorisedOfficerEmail", "bankContact",
  images:listing_images(id, url, "sortOrder", "isPrimary")
`

export type AdminEditableListing = Omit<Listing, "images" | "bank"> & {
  bankId: string
  bank: { id: string; name: string; shortName: string }
  images: { id: string; url: string; sortOrder: number; isPrimary: boolean }[]
}

export async function getListingForEdit(id: string): Promise<AdminEditableListing | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("listings").select(FULL_EDIT_COLUMNS).eq("id", id).maybeSingle()
  if (error) throw error
  return (data as unknown as AdminEditableListing) ?? null
}

export async function getBanksForAdmin(): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("banks").select("id, name").order("name")
  if (error) throw error
  return data ?? []
}

export type CallbackStatus = "new" | "contacted" | "closed"

export interface AdminCallbackRow {
  id: string
  name: string
  phone: string
  email: string | null
  message: string | null
  source: string
  status: CallbackStatus
  notes: string | null
  createdAt: string
  listing: { title: string; slug: string } | null
}

export interface CallbackFilters {
  status?: CallbackStatus
  q?: string
}

export async function getCallbackRequests(filters: CallbackFilters): Promise<AdminCallbackRow[]> {
  const admin = createAdminClient()
  let query = admin
    .from("callback_requests")
    .select("id, name, phone, email, message, source, status, notes, createdAt, listing:listings(title, slug)")
    .order("createdAt", { ascending: false })

  if (filters.status) query = query.eq("status", filters.status)
  if (filters.q) {
    const text = filters.q.replace(/[,()%*]/g, " ").trim()
    if (text) query = query.or(`name.ilike.%${text}%,phone.ilike.%${text}%,email.ilike.%${text}%`)
  }

  const { data, error } = await query.limit(200)
  if (error) throw error
  return (data ?? []) as unknown as AdminCallbackRow[]
}

export interface EditablePricingSettings {
  freeSignupCredits: number
  annualPrice: number
  servicePackagePrice: number
  successFeePct: number
}

const SETTINGS_KEY_MAP: Record<keyof EditablePricingSettings, string> = {
  freeSignupCredits: "free_signup_credits",
  annualPrice: "annual_price",
  servicePackagePrice: "service_package_price",
  successFeePct: "success_fee_pct",
}

export async function updatePricingSettings(values: EditablePricingSettings, adminId: string): Promise<void> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  for (const [field, key] of Object.entries(SETTINGS_KEY_MAP) as [keyof EditablePricingSettings, string][]) {
    const { error } = await admin
      .from("settings")
      .update({ value: values[field], updatedAt: now, updatedBy: adminId })
      .eq("key", key)
    if (error) throw error
  }
}
