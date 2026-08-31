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

/**
 * The per-section StatCard figures on the admin panel — Packages, Payments,
 * Users and Alerts. Everything here is queried; nothing is a placeholder.
 *
 * Several will read 0 against the live database because the tables behind them
 * are genuinely empty (`payments`, `service_packages`, `alert_subscriptions`).
 * A zero is the correct answer and is rendered as one.
 *
 * Money is summed in JS from the fetched rows rather than by a Postgres
 * aggregate, matching how `getDashboardKpis()` already computes
 * `revenueThisMonth`. That is fine at this size and keeps one idiom in the
 * file; it is the thing to revisit first if these tables ever get large.
 */
export interface AdminSectionStats {
  packages: {
    totalSold: number
    totalRevenue: number
    thisMonthSold: number
    thisMonthRevenue: number
    /** Share of registered users who have bought a package. null when there are no users to divide by. */
    conversionPct: number | null
  }
  payments: {
    allTimeRevenue: number
    allTimeCount: number
    thisMonthRevenue: number
    thisMonthCount: number
    outstandingSuccessFees: number
  }
  users: {
    total: number
    paidPackage: number
    free: number
    requestedCallback: number
  }
  alerts: {
    total: number
    email: number
    whatsapp: number
  }
  views: {
    allTime: number
    thisMonth: number
  }
}


export async function getAdminSectionStats(): Promise<AdminSectionStats> {
  const admin = createAdminClient()
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const monthStart = startOfMonth.getTime()

  const [
    packageRows,
    paymentRows,
    totalUsers,
    callbackCount,
    alertsTotal,
    alertsEmail,
    alertsWhatsapp,
    viewsAllTime,
    viewsThisMonth,
  ] =
    await Promise.all([
      admin.from("service_packages").select("userId, amountPaid, createdAt"),
      admin.from("payments").select("amount, createdAt").eq("status", "paid"),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("callback_requests").select("id", { count: "exact", head: true }),
      admin.from("alert_subscriptions").select("id", { count: "exact", head: true }).eq("isActive", true),
      admin.from("alert_subscriptions").select("id", { count: "exact", head: true }).eq("isActive", true).not("email", "is", null),
      admin.from("alert_subscriptions").select("id", { count: "exact", head: true }).eq("isActive", true).not("whatsapp", "is", null),
      admin.from("listing_views").select("id", { count: "exact", head: true }),
      // listing_views timestamps its rows `viewedAt`, not `createdAt`.
      admin.from("listing_views").select("id", { count: "exact", head: true }).gte("viewedAt", new Date(monthStart).toISOString()),
    ])

  const packages = (packageRows.data ?? []) as { userId: string; amountPaid: number | null; createdAt: string }[]
  const payments = (paymentRows.data ?? []) as { amount: number | null; createdAt: string }[]

  // Parsed through utcDate for the reason given on that function: these
  // timestamps come back without a zone marker and would otherwise be read as
  // local time.
  const since = (row: { createdAt: string }) => utcDate(row.createdAt).getTime() >= monthStart
  const thisMonthPackages = packages.filter(since)
  const thisMonthPayments = payments.filter(since)

  const sumPaid = (rows: { amountPaid: number | null }[]) =>
    rows.reduce((total, r) => total + Number(r.amountPaid ?? 0), 0)
  const sumAmount = (rows: { amount: number | null }[]) =>
    rows.reduce((total, r) => total + Number(r.amount ?? 0), 0)

  const users = totalUsers.count ?? 0
  const paidPackageUsers = new Set(packages.map((r) => r.userId)).size

  return {
    packages: {
      totalSold: packages.length,
      totalRevenue: sumPaid(packages),
      thisMonthSold: thisMonthPackages.length,
      thisMonthRevenue: sumPaid(thisMonthPackages),
      conversionPct: users === 0 ? null : (paidPackageUsers / users) * 100,
    },
    payments: {
      allTimeRevenue: sumAmount(payments),
      allTimeCount: payments.length,
      thisMonthRevenue: sumAmount(thisMonthPayments),
      thisMonthCount: thisMonthPayments.length,
      // No table records a success fee as owed. `service_packages.successFeePct`
      // is a rate, not a debt, and nothing records an auction being won. Left at
      // zero deliberately rather than derived from something that does not mean
      // it — same reason getDashboardKpis().successFeesPending is 0.
      outstandingSuccessFees: 0,
    },
    users: {
      total: users,
      paidPackage: paidPackageUsers,
      free: Math.max(0, users - paidPackageUsers),
      requestedCallback: callbackCount.count ?? 0,
    },
    alerts: {
      total: alertsTotal.count ?? 0,
      email: alertsEmail.count ?? 0,
      whatsapp: alertsWhatsapp.count ?? 0,
    },
    views: {
      allTime: viewsAllTime.count ?? 0,
      thisMonth: viewsThisMonth.count ?? 0,
    },
  }
}

export type AdminActivityKind = "callback" | "listing" | "payment"

export interface AdminActivityEvent {
  id: string
  kind: AdminActivityKind
  /** The person the event is about, where it has one. Read from the DB, never invented. */
  actor: string | null
  detail: string
  /** Relative time, e.g. "3 days ago". See the note on formatting below. */
  when: string
}

/**
 * Every `createdAt` in this schema is `timestamp without time zone` holding
 * UTC — `now()` on the database returns `+00`. PostgREST hands them back bare
 * ("2026-08-29T09:18:44.455"), and `new Date()` reads a bare timestamp as
 * *local* time, which puts every event 5h30m out on an IST machine. Stamping
 * the Z is what makes them mean what they say.
 */
function utcDate(value: string): Date {
  return new Date(value.endsWith("Z") ? value : `${value.replace(" ", "T")}Z`)
}

/**
 * Formatted here, on the server, rather than in the client component that
 * renders it. `/admin` is server-rendered, so a relative time computed during
 * render would be computed twice — once on each side — and the two would
 * disagree, which React reports as a hydration mismatch. One value, computed
 * once, avoids that.
 */
function timeAgo(date: Date, now: Date): string {
  const ago = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"} ago`
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return ago(minutes, "minute")
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return ago(hours, "hour")
  const days = Math.floor(hours / 24)
  if (days < 30) return ago(days, "day")
  const months = Math.floor(days / 30)
  if (months < 12) return ago(months, "month")
  return ago(Math.floor(months / 12), "year")
}

/**
 * The Dashboard's Recent Activity feed: the newest real events across the
 * three tables that record one. Returns an empty array when nothing has
 * happened, which the caller renders as an empty state — the previous version
 * of this feed was five hardcoded events naming invented people.
 */
export async function getRecentActivity(limit = 6): Promise<AdminActivityEvent[]> {
  const admin = createAdminClient()

  const [callbacks, listings, payments] = await Promise.all([
    admin
      .from("callback_requests")
      .select("id, name, createdAt, listing:listings(title)")
      .order("createdAt", { ascending: false })
      .limit(limit),
    admin
      .from("listings")
      .select("id, title, city, createdAt")
      .order("createdAt", { ascending: false })
      .limit(limit),
    admin
      .from("payments")
      .select("id, amount, type, createdAt, user:profiles(fullName)")
      .eq("status", "paid")
      .order("createdAt", { ascending: false })
      .limit(limit),
  ])

  const now = new Date()

  const callbackRows = (callbacks.data ?? []) as unknown as {
    id: string
    name: string
    createdAt: string
    listing: { title: string } | null
  }[]
  const listingRows = (listings.data ?? []) as unknown as {
    id: string
    title: string
    city: string
    createdAt: string
  }[]
  const paymentRows = (payments.data ?? []) as unknown as {
    id: string
    amount: number
    type: string
    createdAt: string
    user: { fullName: string | null } | null
  }[]

  const events = [
    ...callbackRows.map((r) => ({
      id: `callback-${r.id}`,
      kind: "callback" as const,
      actor: r.name,
      detail: r.listing?.title ? `requested a callback — ${r.listing.title}` : "requested a callback",
      at: utcDate(r.createdAt),
    })),
    ...listingRows.map((r) => ({
      id: `listing-${r.id}`,
      kind: "listing" as const,
      actor: null,
      detail: `New listing added — ${r.title}, ${r.city}`,
      at: utcDate(r.createdAt),
    })),
    ...paymentRows.map((r) => ({
      id: `payment-${r.id}`,
      kind: "payment" as const,
      actor: r.user?.fullName ?? null,
      detail: `paid ₹${Number(r.amount).toLocaleString("en-IN")} for ${
        r.type === "subscription" ? "an annual membership" : "a service package"
      }`,
      at: utcDate(r.createdAt),
    })),
  ]

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map(({ at, ...event }) => ({ ...event, when: timeAgo(at, now) }))
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
