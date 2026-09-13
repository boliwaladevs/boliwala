"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, Bell, Briefcase, User, LogOut, MessageCircle, FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PhotoSlot } from "@/components/photo-slot"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { toggleShortlist } from "@/app/actions/shortlist"
import { setAlertActive, updateAlertFrequency, deleteAlert } from "@/app/actions/alerts"
import { deleteOwnAccount } from "@/app/actions/account"
import { formatDateShort, formatINR } from "@/lib/format"
import { describeAlertFilters, searchHrefFromAlertFilters } from "@/lib/alerts"
import type { SearchListing } from "@/lib/data/listings"
import type { AlertSubscription } from "@/lib/data/alerts"

type Tab = "saved" | "alerts" | "services" | "info"

interface Profile {
  fullName: string | null
  email: string
  phone: string | null
  creditsBalance: number
  memberSince: string
  city: string | null
  panNumber: string | null
  aadhaarNumber: string | null
}

/**
 * Mirrors the CHECK constraints in migration 0009. Validating here as well as
 * in the database is not redundancy for its own sake: without it the user's
 * only feedback would be a raw Postgres constraint name in a toast.
 */
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const AADHAAR_RE = /^[2-9][0-9]{11}$/

/** Aadhaar is usually written in groups of four; keep only the digits. */
function normaliseAadhaar(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12)
}

function formatAadhaarForDisplay(value: string): string {
  return value.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

const PANEL = "rounded-panel border border-line bg-paper p-6 shadow-card"
const FIELD_LABEL = "text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink2"
const FIELD =
  "h-12 rounded-field border border-line bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink2/70 focus:border-brand"
const PRIMARY_BTN =
  "flex h-12 items-center justify-center rounded-pill bg-brand px-8 text-[14.5px] font-bold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60"
const OUTLINE_PILL =
  "inline-flex h-9 items-center justify-center rounded-pill border border-line bg-paper px-4 text-[13px] font-semibold text-ink transition-colors hover:bg-surface"

const SERVICE_STAGES = [
  { label: "Due Diligence", status: "Completed", state: "done" as const },
  { label: "Bid Mgmt", status: "In Progress", state: "current" as const },
  { label: "Possession", status: "Pending", state: "pending" as const },
  { label: "Loan", status: "Pending", state: "pending" as const },
]

export function ProfileView({
  profile,
  shortlisted,
  alerts,
}: {
  profile: Profile
  shortlisted: SearchListing[]
  alerts: AlertSubscription[]
}) {
  const [activeTab, setActiveTab] = useState<Tab>("saved")
  const [fullName, setFullName] = useState(profile.fullName ?? "")
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [city, setCity] = useState(profile.city ?? "")
  const [panNumber, setPanNumber] = useState(profile.panNumber ?? "")
  const [aadhaarNumber, setAadhaarNumber] = useState(
    profile.aadhaarNumber ? formatAadhaarForDisplay(profile.aadhaarNumber) : "",
  )
  const [savingDetails, setSavingDetails] = useState(false)
  const [alertRows, setAlertRows] = useState(alerts)
  const [, startAlertTransition] = useTransition()
  const [newPassword, setNewPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [savedListings, setSavedListings] = useState(shortlisted)
  const [, startShortlistTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleRemoveShortlist = (listingId: string) => {
    const previous = savedListings
    setSavedListings((prev) => prev.filter((l) => l.id !== listingId))
    startShortlistTransition(async () => {
      const result = await toggleShortlist(listingId)
      if ("error" in result) {
        setSavedListings(previous)
        toast({ variant: "destructive", title: "Couldn't remove property" })
      }
    })
  }

  const displayName = profile.fullName?.trim() || profile.email
  const firstName = displayName.split(" ")[0]
  const initial = displayName.charAt(0).toUpperCase()
  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  const handleLogOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault()

    const pan = panNumber.trim().toUpperCase()
    const aadhaar = normaliseAadhaar(aadhaarNumber)

    if (pan && !PAN_RE.test(pan)) {
      toast({
        variant: "destructive",
        title: "Check the PAN number",
        description: "A PAN is ten characters — five letters, four digits, then a letter. For example ABCDE1234F.",
      })
      return
    }
    if (aadhaar && !AADHAAR_RE.test(aadhaar)) {
      toast({
        variant: "destructive",
        title: "Check the Aadhaar number",
        description: "An Aadhaar number is twelve digits and does not start with 0 or 1.",
      })
      return
    }

    setSavingDetails(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from("profiles")
      // Empty strings would fail the format CHECK constraints, so a cleared
      // field is stored as NULL rather than "".
      .update({
        fullName,
        phone,
        city: city.trim() || null,
        panNumber: pan || null,
        aadhaarNumber: aadhaar || null,
      })
      .eq("id", user?.id)
    setSavingDetails(false)
    if (error) {
      toast({ variant: "destructive", title: "Couldn't save changes", description: error.message })
      return
    }
    setAadhaarNumber(aadhaar ? formatAadhaarForDisplay(aadhaar) : "")
    setPanNumber(pan)
    toast({ title: "Details saved" })
  }

  const handleChangeFrequency = (alertId: string, frequency: string) => {
    const previous = alertRows
    setAlertRows((rows) => rows.map((r) => (r.id === alertId ? { ...r, frequency } : r)))

    startAlertTransition(async () => {
      const result = await updateAlertFrequency(alertId, frequency)
      if ("error" in result) {
        setAlertRows(previous)
        toast({ variant: "destructive", title: "Couldn't change that", description: result.error })
        return
      }
      toast({ title: "Alert updated" })
    })
  }

  const handleDeleteAlert = (alertId: string) => {
    const previous = alertRows
    setAlertRows((rows) => rows.filter((r) => r.id !== alertId))

    startAlertTransition(async () => {
      const result = await deleteAlert(alertId)
      if ("error" in result) {
        setAlertRows(previous)
        toast({ variant: "destructive", title: "Couldn't delete that alert", description: result.error })
        return
      }
      toast({ title: "Alert deleted" })
    })
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)

    // Supabase's updateUser does not ask for the current password, so anyone
    // walking up to an unlocked browser could change it. Re-authenticating
    // first is what makes this a password *change* rather than a takeover.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: currentPassword,
    })
    if (reauthError) {
      setChangingPassword(false)
      toast({ variant: "destructive", title: "Current password is wrong", description: "Check it and try again." })
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPassword(false)
    if (error) {
      toast({ variant: "destructive", title: "Couldn't change password", description: error.message })
      return
    }
    setCurrentPassword("")
    setNewPassword("")
    toast({ title: "Password changed", description: "Use your new password next time you log in." })
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    const result = await deleteOwnAccount()
    if ("error" in result) {
      setDeletingAccount(false)
      toast({ variant: "destructive", title: "Couldn't delete your account", description: result.error })
      return
    }
    toast({ title: "Account deleted", description: "Your account and all its data have been removed." })
    router.push("/")
    router.refresh()
  }

  const handleToggleAlert = (alertId: string, nextActive: boolean) => {
    const previous = alertRows
    setAlertRows((rows) => rows.map((r) => (r.id === alertId ? { ...r, isActive: nextActive } : r)))

    startAlertTransition(async () => {
      const result = await setAlertActive(alertId, nextActive)
      if (result && "error" in result) {
        setAlertRows(previous)
        toast({ variant: "destructive", title: "Couldn't update that alert", description: result.error })
      }
    })
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background pb-14">

      {/* PAGE HEADER */}
      <section className="mb-8 border-b border-line bg-paper py-9">
        <div className="mx-auto max-w-[1240px] px-5">
          <h1 className="font-serif text-[30px] font-semibold tracking-[-0.02em] text-ink md:text-[40px]">
            Welcome back, <span className="text-brand">{firstName}!</span>
          </h1>
        </div>
      </section>

      {/* DASHBOARD LAYOUT */}
      <section className="mx-auto w-full max-w-[1240px] px-5">
        <div className="flex flex-wrap items-start gap-6">

          {/* SIDEBAR */}
          <div className="w-full min-w-[260px] flex-[1_1_260px] overflow-hidden rounded-panel border border-line bg-paper shadow-card lg:max-w-[300px]">
            {/* User Info Header */}
            <div className="flex items-center gap-3.5 border-b border-line p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand font-serif text-[21px] font-semibold text-on-brand">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15.5px] font-bold text-ink">{displayName}</div>
                <div className="truncate text-[12.5px] text-ink2">{profile.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className={FIELD_LABEL}>Credits</span>
              <span className="font-serif text-[22px] font-semibold tabular-nums text-brand">{profile.creditsBalance}</span>
            </div>
            <div className="px-5 py-3 text-[12.5px] text-ink2">Member since {memberSince}</div>

            {/* Navigation */}
            <div className="flex flex-col gap-1 p-2">
              {([
                { id: "saved", icon: Bookmark, label: `Saved Properties (${savedListings.length})` },
                { id: "alerts", icon: Bell, label: `My Alerts (${alertRows.filter((a) => a.isActive).length})` },
                { id: "services", icon: Briefcase, label: "Service Requests (1)" },
                { id: "info", icon: User, label: "Account Info" },
              ] as const).map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[14px] px-4 py-3.5 text-sm font-semibold transition-colors",
                      activeTab === item.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-surface",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="border-t border-line p-3">
              <button
                onClick={handleLogOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-[14px] px-4 text-sm font-bold text-danger transition-colors hover:bg-surface"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>

          {/* MAIN AREA */}
          <div className="w-full min-w-0 flex-[999_1_380px]">
            
            {/* SAVED PROPERTIES TAB */}
            {activeTab === "saved" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink">Saved Properties</h2>
                    <p className="mt-1 text-[13.5px] text-ink2">Properties you're tracking for auction.</p>
                  </div>
                  <Link href="/search" className="text-sm font-bold text-brand hover:underline">
                    Browse More &rarr;
                  </Link>
                </div>

                {savedListings.length === 0 ? (
                  <div className="rounded-panel border border-line bg-paper p-10 text-center text-ink2">
                    <Bookmark className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    No saved properties yet. Browse auctions and tap Save to track them here.
                  </div>
                ) : (
                  <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
                    {savedListings.map((listing) => (
                      <article
                        key={listing.id}
                        className="relative flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card transition-shadow hover:shadow-panel"
                      >
                        <PhotoSlot label="Property photo" ratio="16 / 10">
                          <span className="absolute left-3 top-3 rounded-pill bg-[rgba(24,20,16,0.78)] px-[11px] py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-white backdrop-blur-[6px]">
                            {listing.lender.shortName}
                          </span>
                          <span className="absolute right-3 top-3 rounded-pill bg-brand-soft px-[11px] py-[5px] text-[10.5px] font-bold tabular-nums text-brand">
                            {formatDateShort(listing.auctionDate)}
                          </span>
                          <span className="absolute bottom-3 left-3 rounded-pill bg-[rgba(255,255,255,0.92)] px-[11px] py-[5px] text-[10.5px] font-bold text-[#22201D]">
                            {listing.possessionType === "physical" ? "Physical Possession" : "Symbolic Possession"}
                          </span>
                        </PhotoSlot>

                        <div className="px-[18px] pb-4 pt-4">
                          <div className="font-serif text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
                            {formatINR(listing.reservePrice)}
                          </div>
                          <div className="mb-2.5 text-xs text-ink2">Reserve Price</div>
                          <h3 className="mb-[3px] text-[15.5px] font-semibold leading-[1.35] text-ink">
                            <Link href={`/listing/${listing.slug}`} className="after:absolute after:inset-0 after:content-['']">
                              {listing.title}
                            </Link>
                          </h3>
                          <div className="text-[13.5px] text-ink2">{listing.locality}, {listing.city}</div>
                        </div>

                        <div className="relative z-[1] mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line px-[18px] py-3">
                          <div className="text-[13px] text-ink2">
                            EMD: <strong className="font-bold tabular-nums text-ink">{formatINR(listing.emdAmount)}</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/listing/${listing.slug}`}
                              className="flex h-9 items-center justify-center rounded-pill bg-brand px-4 text-[13px] font-semibold text-on-brand transition-opacity hover:opacity-90"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleRemoveShortlist(listing.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand transition-opacity hover:opacity-80"
                              title="Remove"
                              aria-label="Remove from saved"
                            >
                              <Bookmark className="h-4 w-4 fill-current" />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALERTS TAB */}
            {activeTab === "alerts" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink">Your Property Alerts</h2>
                    <p className="mt-1 text-[13.5px] text-ink2">You&apos;ll be emailed when new matching properties are listed.</p>
                  </div>
                  <Link
                    href="/search"
                    className="inline-flex h-11 items-center rounded-pill bg-brand px-5 text-sm font-bold text-on-brand transition-opacity hover:opacity-90"
                  >
                    + Create from a search
                  </Link>
                </div>

                {alertRows.length === 0 ? (
                  <div className="rounded-panel border border-line bg-paper p-10 text-center shadow-card">
                    <Bell className="mx-auto mb-3 h-8 w-8 opacity-40" />
                    <h3 className="mb-1 font-bold text-ink">No alerts yet</h3>
                    <p className="mb-5 text-sm text-ink2">
                      Run a search, then use &ldquo;Get email alerts for this search&rdquo; to be told when new properties match.
                    </p>
                    <Link
                      href="/search"
                      className="inline-flex h-11 items-center rounded-pill bg-brand px-5 text-sm font-bold text-on-brand transition-opacity hover:opacity-90"
                    >
                      Search properties
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {alertRows.map((alert) => {
                      const chips = describeAlertFilters(alert.filters)
                      return (
                        <div
                          key={alert.id}
                          className={cn(
                            "flex flex-wrap items-start justify-between gap-5 rounded-card border border-line bg-paper p-5 transition-opacity sm:items-center",
                            alert.isActive ? "" : "opacity-[0.62]",
                          )}
                        >
                          <div className="flex min-w-0 flex-[1_1_240px] items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft text-gold">
                              <Bell className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="mb-1 truncate text-base font-bold text-ink">{chips.join(" • ")}</h3>
                              <p className="mb-3 text-[13.5px] text-ink2">
                                {alert.frequency === "daily"
                                  ? "Daily digest"
                                  : alert.frequency === "weekly"
                                    ? "Weekly digest"
                                    : "Instant email"}
                                {" • "}
                                Created {formatDateShort(alert.createdAt)}
                                {alert.isActive ? "" : " • Paused"}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {chips.map((chip) => (
                                  <span
                                    key={chip}
                                    className="rounded-pill bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink2"
                                  >
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex w-full shrink-0 flex-wrap items-center gap-2 border-t border-line pt-4 sm:w-auto sm:border-0 sm:pt-0">
                            <label className="sr-only" htmlFor={`freq-${alert.id}`}>
                              How often to send this alert
                            </label>
                            <select
                              id={`freq-${alert.id}`}
                              value={alert.frequency}
                              onChange={(e) => handleChangeFrequency(alert.id, e.target.value)}
                              className="h-9 cursor-pointer rounded-pill border border-line bg-paper px-3 text-[13px] font-semibold text-ink outline-none transition-colors hover:bg-surface focus:border-brand"
                            >
                              <option value="instant">Instant</option>
                              <option value="daily">Daily digest</option>
                              <option value="weekly">Weekly</option>
                            </select>
                            <Link href={searchHrefFromAlertFilters(alert.filters)} className={OUTLINE_PILL}>
                              View matches
                            </Link>
                            <button
                              onClick={() => handleToggleAlert(alert.id, !alert.isActive)}
                              className={cn(
                                "inline-flex h-9 items-center justify-center rounded-pill border px-4 text-[13px] font-semibold transition-colors",
                                alert.isActive
                                  ? "border-gold-line bg-gold-soft text-gold"
                                  : "border-pos-line bg-pos-soft text-pos",
                              )}
                            >
                              {alert.isActive ? "Pause" : "Resume"}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              aria-label="Delete this alert"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-danger-line text-danger transition-colors hover:bg-surface"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === "services" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-5">
                  <h2 className="font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink">My Service Requests</h2>
                  <p className="mt-1 text-[13.5px] text-ink2">Track the progress of your purchased Boliwala packages.</p>
                </div>

                <div className="rounded-panel border border-line bg-paper p-5 shadow-card sm:p-[26px]">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-ink">End-to-End Package — Flat 303, Vithai Apt, Airoli</h3>
                      <p className="mt-1 text-[13.5px] text-ink2">Purchased 30 Jun 2026 • ₹19,999 paid (Razorpay)</p>
                    </div>
                    <span className="shrink-0 rounded-pill bg-gold-soft px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.06em] text-gold">
                      In Progress
                    </span>
                  </div>

                  {/* Progress Tracker */}
                  <div className="mb-6 flex flex-wrap overflow-hidden rounded-block border border-line">
                    {SERVICE_STAGES.map((stage, i) => (
                      <div
                        key={stage.label}
                        className={cn(
                          "flex-[1_1_130px] p-4 text-center",
                          i < SERVICE_STAGES.length - 1 && "border-b border-r border-line sm:border-b-0",
                          stage.state === "done" && "bg-pos-soft",
                          stage.state === "current" && "bg-gold-soft",
                          stage.state === "pending" && "bg-paper",
                        )}
                      >
                        <span
                          className={cn(
                            "mx-auto mb-2 block h-[22px] w-[22px] rounded-full",
                            stage.state === "done" && "bg-pos",
                            stage.state === "current" && "bg-gold",
                            stage.state === "pending" && "border-2 border-dashed border-ink2",
                          )}
                        />
                        <div
                          className={cn(
                            "text-[11.5px] font-extrabold uppercase tracking-[0.08em]",
                            stage.state === "done" && "text-pos",
                            stage.state === "current" && "text-gold",
                            stage.state === "pending" && "text-ink",
                          )}
                        >
                          {stage.label}
                        </div>
                        <div className="mt-1 text-[12.5px] text-ink2">{stage.status}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button className="flex h-11 items-center gap-2 rounded-pill bg-[#25D366] px-6 text-sm font-bold text-[#0B2E19] transition-opacity hover:opacity-90">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp Team
                    </button>
                    <button className="flex h-11 items-center gap-2 rounded-pill border border-line bg-surface px-6 text-sm font-bold text-ink transition-colors hover:bg-paper">
                      <FileText className="h-4 w-4" />
                      View Due Diligence Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT INFO TAB */}
            {activeTab === "info" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-5">
                  <h2 className="font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink">Account Information</h2>
                  <p className="mt-1 text-[13.5px] text-ink2">Manage your personal details and settings.</p>
                </div>

                <div className={`${PANEL} sm:p-[26px]`}>
                  <form className="flex flex-col gap-5" onSubmit={handleSaveDetails}>

                    <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                      <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL} htmlFor="full-name">Full Name</label>
                        <input id="full-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={FIELD} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL} htmlFor="email-address">Email Address</label>
                        <input id="email-address" type="email" defaultValue={profile.email} disabled className={`${FIELD} cursor-not-allowed text-ink2`} />
                        <span className="text-xs text-ink2">Contact support to change email.</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL} htmlFor="phone-number">Phone Number</label>
                        <input id="phone-number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={FIELD} />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className={FIELD_LABEL} htmlFor="city">City</label>
                        <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className={FIELD} />
                      </div>
                    </div>

                    <div className="mt-1 border-t border-line pt-5">
                      <h3 className="mb-2 font-serif text-xl font-semibold text-ink">KYC Details (Optional)</h3>
                      <p className="mb-5 text-[13.5px] text-ink2">Providing these helps speed up your service onboarding.</p>

                      <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="pan" className={FIELD_LABEL}>PAN Number</label>
                          <input
                            id="pan"
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                            maxLength={10}
                            autoComplete="off"
                            placeholder="ABCDE1234F"
                            className={`${FIELD} uppercase`}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="aadhaar" className={FIELD_LABEL}>Aadhaar Number</label>
                          <input
                            id="aadhaar"
                            type="text"
                            inputMode="numeric"
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(formatAadhaarForDisplay(normaliseAadhaar(e.target.value)))}
                            autoComplete="off"
                            placeholder="1234 5678 9012"
                            className={`${FIELD} tabular-nums`}
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-ink2">
                        Both are optional and are only visible to you. Leave them blank if you would rather not share them.
                      </p>
                    </div>

                    <div className="mt-1 flex justify-end border-t border-line pt-5">
                      <button disabled={savingDetails} className={PRIMARY_BTN}>
                        {savingDetails ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* CHANGE PASSWORD */}
                <div className={`${PANEL} mt-5 sm:p-[26px]`}>
                  <h3 className="mb-2 font-serif text-xl font-semibold text-ink">Change password</h3>
                  <p className="mb-5 text-[13.5px] text-ink2">
                    You&apos;ll be asked for your current password first.
                  </p>

                  <form className="flex flex-col gap-5" onSubmit={handleChangePassword}>
                    <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="current-password" className={FIELD_LABEL}>
                          Current password
                        </label>
                        <input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className={FIELD}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="new-password" className={FIELD_LABEL}>
                          New password
                        </label>
                        <input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          className={FIELD}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button disabled={changingPassword} className={PRIMARY_BTN}>
                        {changingPassword ? "Changing…" : "Change password"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* DELETE ACCOUNT */}
                <div className="mt-5 rounded-panel border border-danger-line bg-paper p-6 shadow-card sm:p-[26px]">
                  <h3 className="mb-2 font-serif text-xl font-semibold text-danger">Delete account</h3>
                  <p className="mb-2 text-[13.5px] text-ink2">
                    This permanently removes your account, saved properties, alerts, unlocked
                    details, credit history and any personal details you have entered.
                  </p>
                  <p className="mb-5 text-[13.5px] font-bold text-danger">
                    This cannot be undone, and your remaining {profile.creditsBalance} credit
                    {profile.creditsBalance === 1 ? "" : "s"} will be lost.
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="delete-confirm" className={FIELD_LABEL}>
                        Type DELETE to confirm
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        autoComplete="off"
                        placeholder="DELETE"
                        className={FIELD}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== "DELETE" || deletingAccount}
                      className="flex h-12 items-center justify-center rounded-pill bg-[#B3261E] px-8 text-[14.5px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {deletingAccount ? "Deleting…" : "Delete my account"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
      
    </div>
  )
}
