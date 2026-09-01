"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { describeAlertFilters } from "@/lib/alerts"
import { CONTACT } from "@/lib/contact"
import { ListingsPanel } from "./admin/listings-panel"
import { ListingFormPanel } from "./admin/listing-form-panel"
import { BulkUploadPanel } from "./admin/bulk-upload-panel"
import { CallbacksPanel } from "./admin/callbacks-panel"
import { SalesEnquiriesPanel } from "./admin/sales-enquiries-panel"
import { PartnersPanel } from "./admin/partners-panel"
import { SettingsPanel } from "./admin/settings-panel"
import type {
  DashboardKpis,
  AdminListingRow,
  AdminCallbackRow,
  AdminActivityEvent,
  AdminSectionStats,
  AdminUserRow,
  AdminPartnerApplicationRow,
  AdminAlertSubscriberRow,
  AdminSalesEnquiryRow,
  AdminPaymentRow,
  AdminPackageRow,
} from "@/lib/data/admin"
import type { PricingSettings, CommissionSettings } from "@/lib/access/types"
import type { AdminPartnerRow, AdminCommissionRow } from "@/lib/data/partners"

const pageMap: Record<string, { title: string; crumb: string }> = {
  'dashboard': { title: 'Dashboard', crumb: 'Boliwala Admin › Overview' },
  'listings': { title: 'All Listings', crumb: 'Boliwala Admin › Listings' },
  'add-listing': { title: 'Add Listing', crumb: 'Boliwala Admin › Listings › Add' },
  'listing-detail': { title: 'Edit Listing + Images', crumb: 'Boliwala Admin › Listings › Flat 303, Airoli' },
  'bulk-upload': { title: 'Bulk Upload Excel', crumb: 'Boliwala Admin › Listings › Bulk Upload' },
  'callbacks': { title: 'Callback Requests', crumb: 'Boliwala Admin › Leads › Callbacks' },
  'sales-enquiries': { title: 'Sales Enquiries', crumb: 'Boliwala Admin › Leads › Sales Enquiries' },
  'packages': { title: 'Package Purchases', crumb: 'Boliwala Admin › Leads › Packages' },
  'requests': { title: 'Service Pipeline', crumb: 'Boliwala Admin › Leads › Pipeline' },
  'payments': { title: 'Payments', crumb: 'Boliwala Admin › Finance › Payments' },
  'success-fees': { title: 'Success Fees', crumb: 'Boliwala Admin › Finance › Success Fees' },
  'users': { title: 'All Users', crumb: 'Boliwala Admin › Users' },
  'partners': { title: 'Channel Partners', crumb: 'Boliwala Admin › Partners' },
  'alerts': { title: 'Alert Subscribers', crumb: 'Boliwala Admin › Engagement › Alert Subscribers' },
  'alert-engine': { title: 'Alert Engine & Log', crumb: 'Boliwala Admin › Engagement › Alert Engine' },
  'email-campaigns': { title: 'Email Campaigns', crumb: 'Boliwala Admin › Engagement › Email Campaigns' },
  'whatsapp': { title: 'WhatsApp Tools', crumb: 'Boliwala Admin › Engagement › WhatsApp Tools' },
  'segments': { title: 'Segments & Export', crumb: 'Boliwala Admin › Engagement › Segments' },
  'engagement': { title: 'Engagement Analytics', crumb: 'Boliwala Admin › Engagement › Analytics' },
  'analytics': { title: 'Site Analytics', crumb: 'Boliwala Admin › Tools › Site Analytics' },
  'settings': { title: 'Settings', crumb: 'Boliwala Admin › Settings' },
}

interface NavGroupItem {
  id: string
  icon: string
  label: string
  badge?: string
  badgeColor?: string
}

interface NavGroupDef {
  label: string
  items: NavGroupItem[]
}

/**
 * Which sidebar groups the user has collapsed.
 *
 * Stored as the collapsed labels rather than the open ones, so the default is
 * "everything open" and a group added later shows up instead of silently
 * hiding behind a stale preference.
 */
/**
 * What a StatCard shows when **nothing in the schema records the figure** —
 * emails sent, WhatsApp queue depth, open and click rates, PDF downloads,
 * campaign templates. All of these were hardcoded to invented numbers.
 *
 * Deliberately not 0. A zero claims we measured and found none; the truth is
 * that there is no table to measure. This way the panel neither lies nor
 * quietly drops a metric someone planned for.
 *
 * Lives here rather than in lib/data/admin.ts because that module is
 * server-only, and importing a value (as opposed to a type) from it into this
 * client component pulls the server bundle across and fails the build.
 */
const NOT_TRACKED = "—"

const NAV_COLLAPSED_KEY = "bw_admin_nav_collapsed"

/** Pill tint per service-package status. The label is the status itself. */
const PACKAGE_STATUS_PILL: Record<AdminPackageRow["status"], "gold" | "blue" | "green" | "gray"> = {
  pending: "gold",
  active: "blue",
  completed: "green",
  cancelled: "gray",
}

/** Pill tint per application status. The label is the status itself. */
const PARTNER_STATUS_PILL: Record<AdminPartnerApplicationRow["status"], string> = {
  new: "gold",
  contacted: "blue",
  approved: "green",
  rejected: "gray",
}

/** Icon and tint per activity kind. The text itself comes from the database. */
const ACTIVITY_STYLE: Record<AdminActivityEvent["kind"], { icon: string; bg: string }> = {
  callback: { icon: "📞", bg: "bg-red-100 dark:bg-red-500/20" },
  listing: { icon: "🏠", bg: "bg-blue-100 dark:bg-blue-500/20" },
  payment: { icon: "💰", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
}

export function AdminView({
  adminName,
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
}: {
  adminName: string
  kpis: DashboardKpis
  initialListings: AdminListingRow[]
  lenders: { id: string; name: string }[]
  initialCallbacks: AdminCallbackRow[]
  pricingSettings: PricingSettings
  activity: AdminActivityEvent[]
  sectionStats: AdminSectionStats
  users: AdminUserRow[]
  partnerApplications: AdminPartnerApplicationRow[]
  alertSubscribers: AdminAlertSubscriberRow[]
  salesEnquiries: AdminSalesEnquiryRow[]
  payments: AdminPaymentRow[]
  packages: AdminPackageRow[]
  partners: AdminPartnerRow[]
  commissions: AdminCommissionRow[]
  commissionSettings: CommissionSettings
}) {
  const [activePage, setActivePage] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [editingListingId, setEditingListingId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  const currentPage = pageMap[activePage] || pageMap['dashboard']

  /**
   * The Channel Partners header used to carry a hardcoded active/pending count.
   * Counted from the rows instead — an application is pending until someone
   * decides on it, and `contacted` is still undecided.
   */
  // The click-to-chat generator used to display a hardcoded +91 98765 43210 and
  // a wa.me link to match — a fake number in an admin tool is still a fake
  // number. It now starts from the configured contact number, which is empty
  // until the client supplies one, and says so rather than inventing one.
  const [chatNumber, setChatNumber] = useState(CONTACT.whatsappHref?.replace("https://wa.me/", "") ?? "")
  const [chatMessage, setChatMessage] = useState("Hi, I'm interested in this property")
  const chatDigits = chatNumber.replace(/\D/g, "")
  const chatLink = chatDigits ? `https://wa.me/${chatDigits}?text=${encodeURIComponent(chatMessage)}` : null

  /** Resolves bank ids in saved alert filters to names, so chips read "SBI", not a UUID. */
  const lenderNames = new Map(lenders.map((b) => [b.id, b.name]))

  const partnerCounts = {
    approved: partnerApplications.filter((p) => p.status === 'approved').length,
    pending: partnerApplications.filter((p) => p.status === 'new' || p.status === 'contacted').length,
  }

  /** Indian-format rupees. Whole rupees only — no fractional paise on a KPI card. */
  const inr = (amount: number) => `₹${Math.round(amount).toLocaleString('en-IN')}`

  /** Same short form the Callbacks panel uses, so dates read alike across the admin. */
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })

  /**
   * A table with nothing in it says **why** it is empty.
   *
   * "No data" invites the reading that something is broken. Every one of these
   * tables is empty because the table behind it has no rows yet, and several
   * cannot have rows until a flow that does not exist is built — the copy has
   * to carry that, because the alternative is what used to be here: invented
   * people making an empty product look busy.
   */
  const EmptyRow = ({ cols, children }: { cols: number; children: React.ReactNode }) => (
    <tr>
      <td colSpan={cols} className="p-8 text-center text-muted-foreground text-[13px] leading-relaxed">{children}</td>
    </tr>
  )

  const goToAddListing = () => { setEditingListingId(null); setActivePage('add-listing') }
  const goToEditListing = (id: string) => { setEditingListingId(id); setActivePage('listing-detail') }
  const goToBulkUpload = () => setActivePage('bulk-upload')

  const NavItem = ({ id, icon, label, badge, badgeColor = "bg-red-500" }: any) => {
    const isActive = activePage === id
    return (
      <div
        onClick={() => { setActivePage(id); setIsSidebarOpen(false); }}
        className={`flex items-center gap-2.5 px-5 py-2.5 cursor-pointer transition-all relative ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-white/10 text-white/65 hover:text-white'
          }`}
      >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-300 rounded-r-sm" />}
        <span className="text-[15px] shrink-0 w-5 text-center">{icon}</span>
        <span className={`text-[13px] flex-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {badge && <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full min-w-[20px] text-center ${badgeColor}`}>{badge}</span>}
      </div>
    )
  }

  // A badge is a notification count, so zero means no chip rather than a "0"
  // chip on every row. That is not hiding the number — the Dashboard StatCards
  // below state each of these figures outright, zero included.
  const badgeCount = (n: number) => (n > 0 ? String(n) : undefined)

  // The sidebar as data rather than markup, so each group can carry its own
  // disclosure state and roll its children's badges up onto a collapsed header.
  const navGroups: NavGroupDef[] = [
    {
      label: "Listings",
      items: [
        { id: "dashboard", icon: "📊", label: "Dashboard" },
        { id: "listings", icon: "🏠", label: "All Listings", badge: badgeCount(kpis.activeListings), badgeColor: "bg-amber-500" },
        { id: "add-listing", icon: "➕", label: "Add Listing" },
        { id: "bulk-upload", icon: "📂", label: "Bulk Upload Excel" },
      ],
    },
    {
      label: "Leads & Sales",
      items: [
        { id: "callbacks", icon: "📞", label: "Callback Requests", badge: badgeCount(kpis.callbackRequestsUnread) },
        { id: "sales-enquiries", icon: "💬", label: "Sales Enquiries", badge: badgeCount(kpis.salesEnquiriesNew) },
        { id: "packages", icon: "💼", label: "Package Purchases", badge: badgeCount(kpis.packagePurchases), badgeColor: "bg-amber-500" },
        { id: "requests", icon: "📋", label: "Service Pipeline" },
      ],
    },
    {
      label: "Finance",
      items: [
        { id: "payments", icon: "💰", label: "Payments" },
        { id: "success-fees", icon: "🏆", label: "Success Fees", badge: badgeCount(kpis.successFeesPending) },
      ],
    },
    {
      label: "Users & Partners",
      items: [
        { id: "users", icon: "👥", label: "All Users" },
        { id: "partners", icon: "🤝", label: "Channel Partners", badge: badgeCount(kpis.pendingPartnerApplications), badgeColor: "bg-amber-500" },
      ],
    },
    {
      label: "Engagement",
      items: [
        { id: "alerts", icon: "🔔", label: "Alert Subscribers" },
        { id: "alert-engine", icon: "⚡", label: "Alert Engine & Log" },
        { id: "email-campaigns", icon: "📧", label: "Email Campaigns" },
        { id: "whatsapp", icon: "💬", label: "WhatsApp Tools" },
        { id: "segments", icon: "🎯", label: "Segments & Export" },
        { id: "engagement", icon: "📊", label: "Engagement Analytics" },
      ],
    },
    {
      label: "Tools",
      items: [
        { id: "analytics", icon: "📈", label: "Site Analytics" },
        { id: "settings", icon: "⚙️", label: "Settings" },
      ],
    },
  ]

  // Read after mount, not during render: this component is server-rendered and
  // localStorage does not exist there. Everything open is the honest fallback.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NAV_COLLAPSED_KEY)
      if (raw) setCollapsedGroups(JSON.parse(raw))
    } catch {
      // Private windows and cleared site data both land here. Not worth a UI.
    }
  }, [])

  // Never leave the group holding the active item collapsed — a refresh always
  // starts on the Dashboard, and panels navigate here programmatically, so the
  // sidebar would otherwise hide where you are. Deliberately not persisted:
  // "I collapsed Engagement" should still hold once you leave Engagement.
  // The functional update matters — on mount this runs in the same batch as the
  // restore above and must see the restored list, not the initial one.
  useEffect(() => {
    const active = navGroups.find((g) => g.items.some((i) => i.id === activePage))?.label
    if (!active) return
    setCollapsedGroups((prev) => (prev.includes(active) ? prev.filter((l) => l !== active) : prev))
    // navGroups is rebuilt every render; activePage is what actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage])

  const toggleGroup = (label: string) => {
    const next = collapsedGroups.includes(label)
      ? collapsedGroups.filter((l) => l !== label)
      : [...collapsedGroups, label]
    setCollapsedGroups(next)
    try {
      window.localStorage.setItem(NAV_COLLAPSED_KEY, JSON.stringify(next))
    } catch {
      // Same as above: the sidebar works, the preference just will not survive.
    }
  }

  // A collapsed group must still show what it is hiding. A folded-away
  // "Leads & Sales" that swallows an unread callback count is a regression, not
  // a feature, so the children's badges roll up into one on the header. Red
  // wins over amber: it is the colour the unread counts use.
  const groupBadge = (group: NavGroupDef) => {
    const badged = group.items.filter((i) => i.badge && i.badge !== "0")
    if (badged.length === 0) return null
    return {
      total: String(badged.reduce((sum, i) => sum + (Number(i.badge) || 0), 0)),
      color: badged.some((i) => (i.badgeColor ?? "bg-red-500") === "bg-red-500") ? "bg-red-500" : "bg-amber-500",
    }
  }

  const StatCard = ({ icon, trend, trendUp = true, trendFlat = false, value, label, iconBg }: any) => (
    <div className="bg-card border border-border rounded-xl p-4.5 shadow-sm">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[17px] ${iconBg}`}>{icon}</div>
        {trend && (
          <div className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${trendFlat ? 'bg-secondary text-muted-foreground' :
            trendUp ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20' : 'bg-red-100 text-red-600 dark:bg-red-500/20'
            }`}>{trend}</div>
        )}
      </div>
      <div className="font-display text-2xl font-extrabold text-foreground tracking-tight mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )

  const AlertStrip = ({ icon, title, subtitle, linkText, linkAction, type = "warning" }: any) => {
    const styles = {
      warning: "bg-amber-50 border-amber-500/25 dark:bg-amber-500/10 dark:border-amber-500/20",
      danger: "bg-red-50 border-red-500/20 dark:bg-red-500/10 dark:border-red-500/20",
      info: "bg-blue-50 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/20",
    }
    return (
      <div className={`rounded-lg p-3.5 flex items-start gap-3 border mb-3 ${styles[type as keyof typeof styles]}`}>
        <span className="text-[17px] shrink-0 mt-0.5">{icon}</span>
        <div>
          <div className="text-[13px] font-bold text-foreground mb-0.5">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground leading-relaxed">{subtitle}</div>}
          {linkText && <span onClick={linkAction} className="text-xs font-semibold text-primary cursor-pointer mt-1 inline-block hover:underline">{linkText}</span>}
        </div>
      </div>
    )
  }

  const Th = ({ children }: any) => <th className="p-3 text-[11px] font-bold uppercase tracking-[0.8px] text-muted-foreground text-left">{children}</th>
  const Td = ({ children, className = "" }: any) => <td className={`p-3 text-[13px] text-muted-foreground ${className}`}>{children}</td>
  const Pill = ({ children, type }: any) => {
    const styles = {
      green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20",
      gold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20",
      red: "bg-red-100 text-red-600 dark:bg-red-500/20",
      purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/20",
      gray: "bg-secondary text-muted-foreground",
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/20",
    }
    return <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${styles[type as keyof typeof styles]}`}>{children}</span>
  }
  const RaBtn = ({ children, primary = false, danger = false }: any) => (
    <button className={`h-7 px-2.5 rounded-md text-[11px] font-semibold border-2 transition-colors whitespace-nowrap ${primary ? 'bg-primary border-primary text-primary-foreground hover:bg-primary/90' :
      danger ? 'border-border bg-background text-muted-foreground hover:border-destructive hover:text-destructive' :
        'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary'
      }`}>{children}</button>
  )

  const TcHead = ({ title, acts }: any) => (
    <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3">
      <div className="font-display text-[15px] font-bold text-foreground flex items-center gap-2">{title}</div>
      <div className="flex items-center gap-2 flex-wrap">{acts}</div>
    </div>
  )

  const TcActionSelect = ({ options }: any) => (
    <select className="h-8 px-2.5 border-2 border-border rounded-lg text-xs text-muted-foreground bg-background outline-none cursor-pointer">
      {options.map((o: string, i: number) => <option key={i}>{o}</option>)}
    </select>
  )
  const TcActionBtn = ({ children, primary = false }: any) => (
    <button className={`h-8 px-3.5 text-xs font-semibold rounded-lg transition-colors ${primary ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-background border-2 border-border text-muted-foreground hover:border-muted-foreground'}`}>{children}</button>
  )

  const FormSection = ({ title, children, foot }: any) => (
    <div className="bg-card border border-border rounded-xl shadow-sm mb-4">
      <div className="px-5 py-3.5 border-b border-border font-display text-[15px] font-bold text-foreground">{title}</div>
      <div className="p-5">{children}</div>
      {foot && <div className="px-5 py-3.5 border-t border-border bg-muted/50 flex justify-end gap-2">{foot}</div>}
    </div>
  )

  const Flbl = ({ children }: any) => <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{children}</label>
  const Finp = ({ defaultValue, type = "text", placeholder }: any) => <input type={type} defaultValue={defaultValue} placeholder={placeholder} className="w-full h-9 px-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary" />
  const Fsel = ({ options }: any) => (
    <select className="w-full h-9 px-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary">
      {options.map((o: string, i: number) => <option key={i}>{o}</option>)}
    </select>
  )

  return (
    <div className="flex min-h-screen bg-muted/50 font-sans text-sm text-foreground">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] bg-[#111827] flex flex-col transition-transform duration-300 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4.5 border-b border-white/10 pt-5 pb-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-display text-[15px] font-extrabold text-white shrink-0">B</div>
            <div>
              <div className="font-display text-base font-extrabold text-white tracking-tight leading-none">Boli<span className="text-amber-400">wala</span></div>
              <div className="text-[9px] text-white/35 uppercase tracking-[1px] block mt-0.5 font-bold">Admin Panel</div>
            </div>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-white/50 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          {navGroups.map((group) => {
            const isOpen = !collapsedGroups.includes(group.label)
            const rollup = groupBadge(group)
            return (
              <Collapsible key={group.label} open={isOpen} onOpenChange={() => toggleGroup(group.label)}>
                <CollapsibleTrigger className="w-full flex items-center gap-1.5 px-5 pt-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[1.2px] text-white/30 hover:text-white/60 transition-colors">
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                  <span className="flex-1 text-left">{group.label}</span>
                  {!isOpen && rollup && (
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full min-w-[20px] text-center ${rollup.color}`}>{rollup.total}</span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {group.items.map((item) => (
                    <NavItem key={item.id} id={item.id} icon={item.icon} label={item.label} badge={item.badge} badgeColor={item.badgeColor} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
        <div className="p-3.5 border-t border-white/10 flex items-center gap-2.5 mt-auto shrink-0 bg-[#0A0F1C]">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[13px] font-bold text-white shrink-0">{adminName.charAt(0).toUpperCase()}</div>
          <div><div className="text-[13px] font-semibold text-white leading-tight">{adminName}</div><div className="text-[11px] text-white/40">Admin</div></div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-h-screen md:ml-[240px] overflow-x-hidden relative">
        <header className="bg-card border-b border-border px-4 sm:px-7 h-14 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center">
              <h1 className="font-display text-base font-bold text-foreground">{currentPage.title}</h1>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-3 px-3 border-l border-border">{currentPage.crumb}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 bg-muted border border-border rounded-lg px-3 h-8.5">
              <span>🔍</span><input type="text" placeholder="Search…" className="bg-transparent border-none outline-none text-[13px] text-foreground w-[180px] placeholder:text-muted-foreground" />
            </div>
            <button className="w-8.5 h-8.5 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-secondary relative text-[15px]">
              🔔<span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-[1.5px] border-card"></span>
            </button>
            <button onClick={goToAddListing} className="hidden sm:flex h-8.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-[13px] items-center gap-1.5 transition-colors">➕ Add Listing</button>
            <button onClick={goToBulkUpload} className="hidden md:flex h-8.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[13px] items-center gap-1.5 transition-colors">📂 Bulk Upload</button>
          </div>
        </header>

        <div className="p-4 sm:p-7 flex-1">

          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="🏠" iconBg="bg-blue-100 dark:bg-blue-500/20" value={kpis.activeListings} label="Active Listings" />
                <StatCard icon="💰" iconBg="bg-emerald-100 dark:bg-emerald-500/20" value={`₹${kpis.revenueThisMonth.toLocaleString('en-IN')}`} label="Revenue This Month" />
                <StatCard icon="📞" iconBg="bg-red-100 dark:bg-red-500/20" value={kpis.callbackRequestsUnread} label="Callback Requests (unread)" />
                <StatCard icon="💼" iconBg="bg-amber-100 dark:bg-amber-500/20" value={kpis.packagePurchases} label="Package Purchases" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" iconBg="bg-purple-100 dark:bg-purple-500/20" value={kpis.registeredUsers.toLocaleString('en-IN')} label="Registered Users" />
                <StatCard icon="🏆" iconBg="bg-emerald-100 dark:bg-emerald-500/20" value={kpis.auctionsClosed} label="Auctions Closed" />
                <StatCard icon="🔔" iconBg="bg-blue-100 dark:bg-blue-500/20" value={kpis.alertSubscribers.toLocaleString('en-IN')} label="Alert Subscribers" />
                <StatCard icon="🏆" iconBg="bg-red-100 dark:bg-red-500/20" value={kpis.successFeesPending} label="Success Fees Pending" />
              </div>

              <div className="space-y-2.5 pt-1">
                {kpis.callbackRequestsUnread > 0 && (
                  <AlertStrip type="danger" icon="📞" title={`${kpis.callbackRequestsUnread} callback request(s) unread`} subtitle="Users have requested a call from Boliwala." linkText="View Callback Requests →" linkAction={() => setActivePage('callbacks')} />
                )}
                {kpis.pendingPartnerApplications > 0 && (
                  <AlertStrip type="info" icon="🤝" title={`${kpis.pendingPartnerApplications} new channel partner application(s) pending`} linkText="Review Applications →" linkAction={() => setActivePage('partners')} />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display text-[15px] font-bold text-foreground flex items-center gap-2">⚡ Recent Activity</h3></div>
                  <div className="px-5 py-1">
                    {activity.length === 0 ? (
                      <div className="py-8 text-center text-[13px] text-muted-foreground">
                        No activity yet. Callbacks, new listings and payments will appear here as they happen.
                      </div>
                    ) : activity.map((item, i) => {
                      const style = ACTIVITY_STYLE[item.kind]
                      return (
                        <div key={item.id} className={`flex items-start gap-3 py-3 ${i !== activity.length - 1 ? 'border-b border-border' : ''}`}>
                          <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[13px] shrink-0 ${style.bg}`}>{style.icon}</div>
                          <div>
                            <div className="text-[13px] text-muted-foreground leading-relaxed">
                              {item.actor && <strong className="font-semibold text-foreground">{item.actor}</strong>}
                              {item.actor ? ` ${item.detail}` : item.detail}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">{item.when}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display text-[15px] font-bold text-foreground">⚡ Quick Actions</h3></div>
                    <div className="p-4.5"><div className="grid grid-cols-4 gap-2.5">
                      {[{ i: "🏠", l: "Add Listing", id: "add-listing" }, { i: "📂", l: "Bulk Upload", id: "bulk-upload" }, { i: "📞", l: "Callbacks", id: "callbacks" }, { i: "💼", l: "Packages", id: "packages" }, { i: "💰", l: "Payments", id: "payments" }, { i: "👥", l: "Users", id: "users" }, { i: "🔔", l: "Alerts", id: "alerts" }, { i: "📈", l: "Analytics", id: "analytics" }].map((qa, i) => (
                        <div key={i} onClick={() => qa.id === 'add-listing' ? goToAddListing() : setActivePage(qa.id)} className="bg-card border border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-md transition-all group">
                          <div className="text-[22px] mb-1.5">{qa.i}</div><div className="text-xs font-semibold text-muted-foreground group-hover:text-primary">{qa.l}</div>
                        </div>
                      ))}
                    </div></div>
                  </div>
                  <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display text-[15px] font-bold text-foreground">📈 Revenue — Last 8 Months</h3></div>
                    <div className="p-4.5">
                      <div className="flex items-end gap-1.5 h-[52px]">
                        {[35, 50, 42, 65, 58, 72, 80, 100].map((h, i) => <div key={i} className={`flex-1 rounded-t-sm ${i === 7 ? 'bg-primary' : 'bg-blue-100 dark:bg-blue-500/20'}`} style={{ height: `${h}%` }}></div>)}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m, i) => <div key={i} className={`flex-1 text-center text-[10px] ${i === 7 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{m}</div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ALL LISTINGS */}
          {activePage === 'listings' && (
            <ListingsPanel
              initialListings={initialListings}
              lenders={lenders}
              onAddListing={goToAddListing}
              onEditListing={goToEditListing}
              onBulkUpload={goToBulkUpload}
            />
          )}

          {/* ADD / EDIT LISTING */}
          {(activePage === 'add-listing' || activePage === 'listing-detail') && (
            <ListingFormPanel
              listingId={editingListingId}
              lenders={lenders}
              onSaved={(id) => { setEditingListingId(id); setActivePage('listing-detail') }}
              onCancel={() => setActivePage('listings')}
            />
          )}

          {/* BULK UPLOAD */}
          {activePage === 'bulk-upload' && <BulkUploadPanel lenders={lenders} />}

          {/* CALLBACKS */}
          {activePage === 'callbacks' && <CallbacksPanel initialRows={initialCallbacks} />}

          {/* SALES ENQUIRIES */}
          {activePage === 'sales-enquiries' && <SalesEnquiriesPanel initialRows={salesEnquiries} />}

          {/* PACKAGES */}
          {activePage === 'packages' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Packages Sold" value={sectionStats.packages.totalSold} trend={`All time · ${inr(sectionStats.packages.totalRevenue)} revenue`} trendFlat iconBg="bg-blue-100" />
                <StatCard label="This Month" value={sectionStats.packages.thisMonthSold} trend={inr(sectionStats.packages.thisMonthRevenue)} trendFlat iconBg="bg-blue-100" />
                <StatCard label="Conversion Rate" value={sectionStats.packages.conversionPct === null ? '—' : `${sectionStats.packages.conversionPct.toFixed(1)}%`} trend="Signups → Package" trendFlat iconBg="bg-blue-100" />
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="💼 ₹9,999 Package Purchases" acts={<><input className="h-8 px-3 border-2 border-border rounded-lg text-[13px] bg-background w-[180px]" placeholder="Search name…" /><TcActionBtn>⬇️ Export</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Client</Th><Th>Property of Interest</Th><Th>Package</Th><Th>Purchased</Th><Th>Pipeline Status</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    {packages.length === 0 ? (
                      <EmptyRow cols={6}>
                        No package purchases yet. Packages are sold by the team — a row appears here when a sales
                        enquiry is granted a Full Service package. There is no self-serve checkout.
                      </EmptyRow>
                    ) : packages.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-border hover:bg-muted/30">
                        <Td>
                          <div className="font-bold text-foreground">{pkg.user?.fullName?.trim() || pkg.user?.email || '""" + DASH + """'}</div>
                          <div className="text-[11px]">{pkg.user?.email}</div>
                        </Td>
                        <Td>{pkg.listing ? `${pkg.listing.title}, ${pkg.listing.city}` : 'Not yet assigned'}</Td>
                        <Td><Pill type="blue">{inr(pkg.amountPaid)} + {pkg.successFeePct}%</Pill></Td>
                        <Td>{shortDate(pkg.createdAt)}</Td>
                        <Td><Pill type={PACKAGE_STATUS_PILL[pkg.status]}>{pkg.status}</Pill></Td>
                        <Td><RaBtn>View Pipeline</RaBtn></Td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activePage === 'payments' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Revenue All Time" value={inr(sectionStats.payments.allTimeRevenue)} trend={`${sectionStats.payments.allTimeCount} transaction${sectionStats.payments.allTimeCount === 1 ? '' : 's'}`} trendFlat />
                <StatCard label="This Month" value={inr(sectionStats.payments.thisMonthRevenue)} trend={`${sectionStats.payments.thisMonthCount} transaction${sectionStats.payments.thisMonthCount === 1 ? '' : 's'}`} trendFlat />
                <StatCard label="Outstanding Success Fees" value={inr(sectionStats.payments.outstandingSuccessFees)} trend="Not yet tracked — no table records a fee as owed" trendFlat />
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="💰 All Transactions" acts={<><TcActionSelect options={['All Types', '₹9,999 Package', '1% Success Fee']} /><TcActionBtn>⬇️ Export CSV</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Date</Th><Th>Client</Th><Th>Type</Th><Th>Txn ID</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <EmptyRow cols={6}>
                        No transactions yet. Online payment is not connected — a row appears here when an admin
                        grants an entitlement after taking payment directly.
                      </EmptyRow>
                    ) : payments.map((pay) => (
                      <tr key={pay.id} className="border-b border-border hover:bg-muted/30">
                        <Td>{shortDate(pay.createdAt)}</Td>
                        <Td className="font-bold text-foreground">{pay.user?.fullName?.trim() || pay.user?.email || '""" + DASH + """'}</Td>
                        <Td>{pay.type === 'subscription' ? 'Annual membership' : 'Full Service package'}</Td>
                        <Td className="font-mono text-xs">{pay.razorpayPaymentId ?? 'Collected directly'}</Td>
                        <Td className="font-bold text-foreground">{inr(pay.amount)}</Td>
                        <Td><Pill type={pay.status === 'paid' ? 'green' : pay.status === 'refunded' ? 'gray' : 'red'}>{pay.status}</Pill></Td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activePage === 'users' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👥" iconBg="bg-blue-100" value={sectionStats.users.total.toLocaleString('en-IN')} label="Total Users" />
                <StatCard icon="💼" iconBg="bg-emerald-100" value={sectionStats.users.paidPackage.toLocaleString('en-IN')} label="Paid Package Users" />
                <StatCard icon="👤" iconBg="bg-purple-100" value={sectionStats.users.free.toLocaleString('en-IN')} label="Free Users" />
                <StatCard icon="📞" iconBg="bg-amber-100" value={sectionStats.users.requestedCallback.toLocaleString('en-IN')} label="Requested Callback" />
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="👥 All Users" acts={<><input className="h-8 px-3 border-2 border-border rounded-lg text-[13px] bg-background w-[180px]" placeholder="Search name, email…" /><TcActionBtn>⬇️ Export CSV</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>User</Th><Th>Phone</Th><Th>Signed Up</Th><Th>Shortlisted</Th><Th>Type</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    {users.length === 0 ? (
                      <EmptyRow cols={6}>No users yet.</EmptyRow>
                    ) : users.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                        <Td>
                          <div className="font-bold text-foreground">{u.fullName?.trim() || '—'}</div>
                          <div className="text-[11px]">{u.email}{u.city ? ` · ${u.city}` : ''}</div>
                        </Td>
                        <Td>{u.phone || '—'}</Td>
                        <Td>{shortDate(u.createdAt)}</Td>
                        <Td>{u.shortlistCount === 0 ? '—' : `${u.shortlistCount} propert${u.shortlistCount === 1 ? 'y' : 'ies'}`}</Td>
                        <Td>
                          {u.role !== 'user'
                            ? <Pill type="purple">{u.role.replace('_', ' ')}</Pill>
                            : u.hasPackage ? <Pill type="green">Paid</Pill> : <Pill type="gray">Free</Pill>}
                        </Td>
                        <Td><RaBtn>View</RaBtn></Td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activePage === 'settings' && <SettingsPanel initialSettings={pricingSettings} initialCommission={commissionSettings} />}

          {/* REQUESTS */}
          {activePage === 'requests' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex border-b-2 border-border mb-4 overflow-x-auto">
                {['All', 'New', 'In Progress', 'Completed', 'Dropped'].map((t, i) => (
                  <div key={i} className={`px-4 py-2 text-[13px] cursor-pointer font-medium whitespace-nowrap -mb-[2px] border-b-2 ${i === 0 ? 'text-primary border-primary font-bold' : 'text-muted-foreground border-transparent'}`}>{t}</div>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="📋 Service Pipeline" acts={<><input className="h-8 px-3 border-2 border-border rounded-lg text-[13px] bg-background w-[180px]" placeholder="Search…" /><TcActionBtn>⬇️ Export</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Client</Th><Th>Service</Th><Th>City</Th><Th>Property</Th><Th>Stage</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    {packages.length === 0 ? (
                      <EmptyRow cols={7}>
                        Nothing in the pipeline yet. A job appears here when a client is granted a service
                        package, which today happens through a sales enquiry rather than a checkout.
                      </EmptyRow>
                    ) : packages.map((pkg) => (
                      <tr key={pkg.id} className="border-b border-border hover:bg-muted/30">
                        <Td>
                          <div className="font-bold text-foreground">{pkg.user?.fullName?.trim() || pkg.user?.email || '""" + DASH + """'}</div>
                          <div className="text-[11px]">📞 {pkg.user?.phone || '""" + DASH + """'}</div>
                        </Td>
                        <Td>Full Service</Td>
                        <Td>{pkg.listing?.city ?? '""" + DASH + """'}</Td>
                        <Td>{pkg.listing?.title ?? 'Not yet assigned'}</Td>
                        <Td>{pkg.status === 'pending' ? 'Not started' : '""" + DASH + """'}</Td>
                        <Td><Pill type={PACKAGE_STATUS_PILL[pkg.status]}>{pkg.status}</Pill></Td>
                        <Td><RaBtn>View</RaBtn></Td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* SUCCESS FEES */}
          {activePage === 'success-fees' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {sectionStats.payments.outstandingSuccessFees > 0 && (
                <AlertStrip type="danger" icon="🏆" title={`${inr(sectionStats.payments.outstandingSuccessFees)} in success fees outstanding`} subtitle="These clients have won auctions. Send invoices and collect the success fee." />
              )}
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="🏆 Success Fee Tracker" acts={<></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Client</Th><Th>Property Won</Th><Th>Winning Bid</Th><Th>Base Paid</Th><Th>1% Due</Th><Th>Date Won</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    <EmptyRow cols={8}>
                      Nothing is tracked here yet. No table records an auction being won or a success fee
                      falling due — <code className="text-xs">service_packages.successFeePct</code> is a rate,
                      not a debt. This section stays empty until that is built.
                    </EmptyRow>
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* PARTNERS */}
          {activePage === 'partners' && (
            <PartnersPanel applications={partnerApplications} partners={partners} commissions={commissions} />
          )}

          {/* ALERTS */}
          {activePage === 'alerts' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon="🔔" iconBg="bg-blue-100" value={sectionStats.alerts.total.toLocaleString('en-IN')} label="Total Subscribers" />
                <StatCard icon="📧" iconBg="bg-emerald-100" value={sectionStats.alerts.email.toLocaleString('en-IN')} label="Email" />
                <StatCard icon="💬" iconBg="bg-amber-100" value={sectionStats.alerts.whatsapp.toLocaleString('en-IN')} label="WhatsApp" />
              </div>
              <FormSection title="📣 Send Manual Alert Broadcast" foot={<><button className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">Preview</button><button className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg">🔔 Send Now</button></>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Flbl>Target City</Flbl><Fsel options={['All Cities', 'Mumbai', 'Delhi']} /></div>
                  <div><Flbl>Property Type</Flbl><Fsel options={['All Types', 'Residential', 'Commercial']} /></div>
                  <div><Flbl>Send Via</Flbl><Fsel options={['Email + WhatsApp', 'Email only', 'WhatsApp only']} /></div>
                  <div className="col-span-1 md:col-span-3"><Flbl>Message</Flbl><textarea className="w-full min-h-[72px] p-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary" placeholder="New Bank of Baroda listings in Airoli…"></textarea></div>
                </div>
              </FormSection>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="Alert Subscribers" acts={<><input className="h-8 px-3 border-2 border-border rounded-lg text-[13px] bg-background w-[180px]" placeholder="Search email…" /><TcActionBtn>⬇️ Export</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Email / WhatsApp</Th><Th>What they are watching</Th><Th>Frequency</Th><Th>Subscribed</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    {alertSubscribers.length === 0 ? (
                      <EmptyRow cols={5}>No active alert subscriptions yet.</EmptyRow>
                    ) : alertSubscribers.map((a) => (
                      <tr key={a.id} className="border-b border-border hover:bg-muted/30">
                        <Td className="font-bold text-foreground">{a.email || a.whatsapp || '—'}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-1">
                            {describeAlertFilters(a.filters, lenderNames).map((chip, i) => (
                              <span key={i} className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{chip}</span>
                            ))}
                          </div>
                        </Td>
                        <Td>{a.frequency}</Td>
                        <Td>{shortDate(a.createdAt)}</Td>
                        <Td><RaBtn danger>Unsubscribe</RaBtn></Td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* ALERT ENGINE */}
          {activePage === 'alert-engine' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertStrip type="warning" icon="⚡" title="Matching is designed, not running" subtitle="Nothing checks a new listing against alert rules yet, and there is no email or WhatsApp integration to deliver a match. Subscribers are being collected; delivery is not built." />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="⚡" iconBg="bg-blue-100" value={sectionStats.alerts.total.toLocaleString('en-IN')} label="Active Alert Rules" />
                <StatCard icon="📧" iconBg="bg-emerald-100" value={NOT_TRACKED} trend="No send log yet" trendFlat label="Emails Sent Today" />
                <StatCard icon="💬" iconBg="bg-amber-100" value={NOT_TRACKED} trend="No queue yet" trendFlat label="WhatsApp Queued" />
                <StatCard icon="👆" iconBg="bg-purple-100" value={NOT_TRACKED} trend="No click tracking yet" trendFlat label="Alert → Click Rate" />
              </div>
              <FormSection title="⚙️ Alert Engine Configuration">
                <div className="flex flex-col gap-3.5">
                  {['Instant email on new listing match', 'Instant WhatsApp on match', 'Auction date reminders', 'Price / status change alerts', 'Inspection reminders'].map((l, i) => (
                    <label key={i} className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative w-9 h-5 bg-primary rounded-full"><div className="absolute top-[3px] left-[3px] bg-white w-3.5 h-3.5 rounded-full transition-transform translate-x-[16px]"></div></div>
                      <span className="text-[13px] text-muted-foreground">{l}</span>
                    </label>
                  ))}
                </div>
              </FormSection>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="📜 Notification Dispatch Log" acts={<><TcActionSelect options={['All Channels', 'Email', 'WhatsApp']} /><TcActionSelect options={['All Types', 'Match Alert', 'Auction Reminder']} /><TcActionBtn>⬇️ Export</TcActionBtn></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Time</Th><Th>Recipient</Th><Th>Type</Th><Th>Trigger</Th><Th>Channel</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    <EmptyRow cols={7}>
                      No dispatches logged. Nothing sends notifications yet — there is no email or WhatsApp
                      integration and no table recording a send.
                    </EmptyRow>
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* EMAIL CAMPAIGNS */}
          {activePage === 'email-campaigns' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="📧" iconBg="bg-blue-100" value={NOT_TRACKED} trend="No templates table yet" trendFlat label="Active Templates" />
                <StatCard icon="📨" iconBg="bg-emerald-100" value={NOT_TRACKED} trend="No send log yet" trendFlat label="Sent This Month" />
                <StatCard icon="👁️" iconBg="bg-amber-100" value={NOT_TRACKED} trend="No open tracking yet" trendFlat label="Avg Open Rate" />
                <StatCard icon="👆" iconBg="bg-purple-100" value={NOT_TRACKED} trend="No click tracking yet" trendFlat label="Avg Click Rate" />
              </div>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="📧 Lifecycle Email Templates" acts={<TcActionBtn primary>➕ New Template</TcActionBtn>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Template</Th><Th>Trigger</Th><Th>Channel</Th><Th>Sent (30d)</Th><Th>Open Rate</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/30"><Td><div className="font-bold text-foreground">Welcome — Part 1</div><div className="text-[11px]">Immediately on signup</div></Td><Td>New signup</Td><Td>📧 Email</Td><Td>48</Td><Td>68%</Td><Td><Pill type="green">Active</Pill></Td><Td><div className="flex gap-1.5"><RaBtn>Edit</RaBtn><RaBtn>Preview</RaBtn></div></Td></tr>
                    <tr className="border-b border-border hover:bg-muted/30"><Td><div className="font-bold text-foreground">Weekly Digest</div><div className="text-[11px]">Roundup of new auctions</div></Td><Td>Every Monday 9 AM</Td><Td>📧 Email</Td><Td>3,840</Td><Td>39%</Td><Td><Pill type="green">Active</Pill></Td><Td><div className="flex gap-1.5"><RaBtn>Edit</RaBtn><RaBtn>Preview</RaBtn></div></Td></tr>
                  </tbody>
                </table></div>
              </div>
              <FormSection title="📣 Send a One-Off Campaign" foot={<><button className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">Preview</button><button className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg">📨 Send Campaign</button></>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Flbl>Audience Segment</Flbl><Fsel options={['All Users', 'Paid Package users', 'Free users only']} /></div>
                  <div><Flbl>Channel</Flbl><Fsel options={['Email', 'Email + WhatsApp']} /></div>
                  <div><Flbl>Schedule</Flbl><Fsel options={['Send now', 'Schedule for later']} /></div>
                  <div className="col-span-1 md:col-span-3"><Flbl>Subject Line</Flbl><Finp placeholder="e.g. 5 new Bank of Baroda auctions in Mumbai this week" /></div>
                  <div className="col-span-1 md:col-span-3"><Flbl>Message Body</Flbl><textarea className="w-full min-h-[72px] p-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary" placeholder="Write your campaign message…"></textarea></div>
                </div>
              </FormSection>
            </div>
          )}

          {/* WHATSAPP */}
          {activePage === 'whatsapp' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertStrip type="warning" icon="💬" title="Phase 1: Click-to-chat mode" subtitle="Automated WhatsApp push needs the official Business API. Until then, use click-to-chat links." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon="💬" iconBg="bg-emerald-100" value={sectionStats.alerts.whatsapp.toLocaleString('en-IN')} label="WhatsApp Subscribers" />
                <StatCard icon="📋" iconBg="bg-amber-100" value={NOT_TRACKED} trend="No queue yet" trendFlat label="Queued Messages" />
                <StatCard icon="🔗" iconBg="bg-blue-100" value={NOT_TRACKED} trend="No click tracking yet" trendFlat label="Click-to-Chat Opens" />
              </div>
              <FormSection title="🔗 Click-to-Chat Link Generator">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Flbl>Boliwala WhatsApp Number</Flbl>
                    <Finp value={chatNumber} onChange={setChatNumber} placeholder="set NEXT_PUBLIC_WHATSAPP_NUMBER" />
                  </div>
                  <div>
                    <Flbl>Pre-filled Message</Flbl>
                    <Finp value={chatMessage} onChange={setChatMessage} />
                  </div>
                </div>
                {chatLink ? (
                  <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs text-foreground flex-1 min-w-[200px] break-all">{chatLink}</span>
                    <RaBtn primary onClick={() => navigator.clipboard.writeText(chatLink)}>📋 Copy Link</RaBtn>
                  </div>
                ) : (
                  <div className="mt-4 p-3.5 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground leading-relaxed">
                    No WhatsApp number configured. Set <code>NEXT_PUBLIC_WHATSAPP_NUMBER</code>, or type one above to
                    generate a link.
                  </div>
                )}
              </FormSection>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="📋 Manual WhatsApp Queue" acts={<TcActionBtn>Mark All Sent</TcActionBtn>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Recipient</Th><Th>Message Type</Th><Th>Property</Th><Th>Queued</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    <EmptyRow cols={5}>
                      Nothing queued. No table holds an outbound WhatsApp message yet.
                    </EmptyRow>
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* SEGMENTS */}
          {activePage === 'segments' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AlertStrip type="info" icon="🎯" title="Build a targeted list, then export" subtitle="Filter users by any combination of criteria, then export the segment as CSV." />
              <FormSection title="🎯 Segment Builder">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Flbl>City</Flbl><Fsel options={['Any City', 'Mumbai', 'Delhi NCR']} /></div>
                  <div><Flbl>User Type</Flbl><Fsel options={['All', 'Paid Package', 'Free only']} /></div>
                  <div><Flbl>Property Interest</Flbl><Fsel options={['Any', 'Residential', 'Commercial']} /></div>
                  <div><Flbl>Engagement</Flbl><Fsel options={['Any', 'Has shortlisted properties', 'Requested callback']} /></div>
                  <div><Flbl>Budget Range</Flbl><Fsel options={['Any', 'Under ₹40L', '₹40L – ₹1Cr']} /></div>
                  <div><Flbl>Channel Available</Flbl><Fsel options={['Any', 'Email', 'WhatsApp', 'Both']} /></div>
                </div>
                <div className="mt-4 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex flex-wrap items-center justify-between gap-2.5">
                  <div className="text-sm text-foreground"><strong className="font-display text-lg">347</strong> users match this segment</div>
                  <div className="flex gap-2"><TcActionBtn>⬇️ Export CSV</TcActionBtn><TcActionBtn primary>📧 Email This Segment</TcActionBtn></div>
                </div>
              </FormSection>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <TcHead title="⭐ Saved Segments" acts={<></>} />
                <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
                  <thead><tr className="bg-muted/50 border-b border-border"><Th>Segment Name</Th><Th>Criteria</Th><Th>Users</Th><Th>Last Used</Th><Th>Actions</Th></tr></thead>
                  <tbody>
                    <tr className="border-b border-border hover:bg-muted/30"><Td className="font-bold text-foreground">Mumbai hot leads</Td><Td>Mumbai · Free · Requested callback</Td><Td>42</Td><Td>Yesterday</Td><Td><div className="flex gap-1.5"><RaBtn>Use</RaBtn><RaBtn>Edit</RaBtn></div></Td></tr>
                  </tbody>
                </table></div>
              </div>
            </div>
          )}

          {/* ENGAGEMENT & ANALYTICS */}
          {(activePage === 'engagement' || activePage === 'analytics') && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon="👁️" iconBg="bg-blue-100" value={sectionStats.views.thisMonth.toLocaleString('en-IN')} label="Listing Views This Month" />
                <StatCard icon="🔍" iconBg="bg-emerald-100" value={sectionStats.views.allTime.toLocaleString('en-IN')} label="Listing Views (All Time)" />
                <StatCard icon="📄" iconBg="bg-amber-100" value={NOT_TRACKED} trend="No download log yet" trendFlat label="PDF Downloads" />
                <StatCard icon="📝" iconBg="bg-purple-100" value={NOT_TRACKED} trend="Views and signups are not joined into a funnel" trendFlat label="View → Signup Rate" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display text-[15px] font-bold text-foreground">📊 Engagement Funnel</h3></div>
                  <div className="p-4.5 space-y-3">
                    {[
                      { l: 'Visited site', p: '100%', bg: 'bg-primary' },
                      { l: 'Viewed a listing', p: '62%', bg: 'bg-emerald-500' },
                      { l: 'Signed up', p: '18%', bg: 'bg-amber-500' },
                      { l: 'Shortlisted / set alert', p: '11%', bg: 'bg-purple-500' },
                      { l: 'Requested callback', p: '4%', bg: 'bg-red-500' },
                      { l: 'Bought ₹9,999 package', p: '1.8%', bg: 'bg-blue-800' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[13px] mb-1"><span className="font-bold text-foreground">{item.l}</span><span className="text-muted-foreground">{item.p}</span></div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.bg}`} style={{ width: item.p }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div className="px-5 py-3.5 border-b border-border"><h3 className="font-display text-[15px] font-bold text-foreground">🏙️ Top Cities</h3></div>
                  <div className="p-4.5 space-y-3">
                    {[
                      { l: 'Mumbai', p: '100%', v: '28,400', bg: 'bg-primary' },
                      { l: 'Delhi NCR', p: '64%', v: '18,200', bg: 'bg-emerald-500' },
                      { l: 'Bengaluru', p: '43%', v: '12,100', bg: 'bg-amber-500' },
                      { l: 'Hyderabad', p: '31%', v: '8,900', bg: 'bg-purple-500' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[13px] mb-1"><span className="font-bold text-foreground">{item.l}</span><span className="text-muted-foreground">{item.v}</span></div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.bg}`} style={{ width: item.p }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  )
}
