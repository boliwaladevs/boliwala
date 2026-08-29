"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bookmark, Bell, Briefcase, User, LogOut, MapPin, Scale, MessageCircle, FileText, CheckCircle2, CircleDashed } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { toggleShortlist } from "@/app/actions/shortlist"
import { setAlertActive } from "@/app/actions/alerts"
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
    <div className="w-full flex flex-col pb-20 bg-background min-h-screen">
      
      {/* HERO SECTION */}
      <section className="bg-secondary/30 py-12 mb-8 border-b border-border">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight font-display">
            Welcome back, <span className="text-blue-600">{firstName}!</span>
          </h1>
        </div>
      </section>

      {/* DASHBOARD LAYOUT */}
      <section className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* SIDEBAR */}
          <div className="w-full lg:w-[280px] bg-background border border-border rounded-2xl shadow-sm overflow-hidden shrink-0">
            {/* User Info Header */}
            <div className="p-6 border-b border-border flex items-center gap-4 bg-secondary/20">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold font-display shrink-0">
                {initial}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-foreground truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credits</span>
              <span className="text-lg font-extrabold text-blue-600 font-display">{profile.creditsBalance}</span>
            </div>
            <div className="px-6 pb-4 text-xs text-muted-foreground">Member since {memberSince}</div>

            {/* Navigation */}
            <div className="p-2 flex flex-col gap-1">
              <button 
                onClick={() => setActiveTab("saved")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "saved" 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Saved Properties ({savedListings.length})
              </button>
              
              <button 
                onClick={() => setActiveTab("alerts")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "alerts" 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <Bell className="w-4 h-4" />
                My Alerts ({alertRows.filter((a) => a.isActive).length})
              </button>

              <button 
                onClick={() => setActiveTab("services")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "services" 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Service Requests (1)
              </button>

              <button 
                onClick={() => setActiveTab("info")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "info" 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <User className="w-4 h-4" />
                Account Info
              </button>
            </div>

            <div className="p-4 border-t border-border mt-2">
              <button onClick={handleLogOut} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          </div>

          {/* MAIN AREA */}
          <div className="flex-1 w-full min-w-0">
            
            {/* SAVED PROPERTIES TAB */}
            {activeTab === "saved" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground font-display">Saved Properties</h2>
                    <p className="text-sm text-muted-foreground mt-1">Properties you're tracking for auction.</p>
                  </div>
                  <Link href="/search" className="text-sm font-bold text-blue-600 hover:text-blue-700 hidden sm:block">
                    Browse More &rarr;
                  </Link>
                </div>
                
                {savedListings.length === 0 ? (
                  <div className="bg-background rounded-2xl border border-border p-10 text-center text-muted-foreground">
                    <Bookmark className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    No saved properties yet. Browse auctions and tap Save to track them here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedListings.map((listing) => (
                      <div key={listing.id} className="bg-background rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                        <div className="relative h-48 bg-secondary/50">
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-lg text-slate-800 shadow-sm flex items-center gap-2">
                            <span>{listing.bank.shortName}</span>
                          </div>
                          <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                            {formatDateShort(listing.auctionDate)}
                          </div>
                          <div className="absolute bottom-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                            {listing.possessionType === "physical" ? "Physical Possession" : "Symbolic Possession"}
                          </div>
                          <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Reserve Price</div>
                          <div className="text-2xl font-bold text-blue-600 font-display mb-3">{formatINR(listing.reservePrice)}</div>
                          <div className="font-bold text-foreground text-sm line-clamp-1 mb-1">{listing.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5 mb-4">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{listing.locality}, {listing.city}</span>
                          </div>
                          <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              EMD: <strong className="text-foreground">{formatINR(listing.emdAmount)}</strong>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/listing/${listing.slug}`} className="bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold py-2 px-4 rounded-lg transition-colors">
                                View
                              </Link>
                              <button
                                onClick={() => handleRemoveShortlist(listing.id)}
                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg transition-colors"
                                title="Remove"
                              >
                                <Bookmark className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALERTS TAB */}
            {activeTab === "alerts" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground font-display">Your Property Alerts</h2>
                    <p className="text-sm text-muted-foreground mt-1">You&apos;ll be emailed when new matching properties are listed.</p>
                  </div>
                  <Link href="/search" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors hidden sm:block">
                    + Create Alert
                  </Link>
                </div>

                {alertRows.length === 0 ? (
                  <div className="bg-background rounded-2xl border border-border shadow-sm p-10 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <h3 className="font-bold text-foreground mb-1">No alerts yet</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      Run a search, then use &ldquo;Get email alerts for this search&rdquo; to be told when new properties match.
                    </p>
                    <Link href="/search" className="inline-block text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors">
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
                          className={`bg-background rounded-2xl border border-border p-6 shadow-sm flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center transition-opacity ${
                            alert.isActive ? "" : "opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                              <Bell className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-foreground text-base mb-1 truncate">
                                {chips.join(" • ")}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
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
                                  <span key={chip} className="text-[10px] font-bold uppercase tracking-wider bg-secondary/50 px-2 py-1 rounded text-muted-foreground">
                                    {chip}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto border-t border-border sm:border-0 pt-4 sm:pt-0 shrink-0">
                            <Link
                              href={searchHrefFromAlertFilters(alert.filters)}
                              className="text-xs font-bold border border-border px-4 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              View matches
                            </Link>
                            <button
                              onClick={() => handleToggleAlert(alert.id, !alert.isActive)}
                              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${
                                alert.isActive
                                  ? "text-red-600 border-red-200 hover:bg-red-50"
                                  : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              {alert.isActive ? "Pause" : "Resume"}
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
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground font-display">My Service Requests</h2>
                  <p className="text-sm text-muted-foreground mt-1">Track the progress of your purchased Boliwala packages.</p>
                </div>

                <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">End-to-End Package — Flat 303, Vithai Apt, Airoli</h3>
                      <p className="text-sm text-muted-foreground mt-1">Purchased 30 Jun 2026 • ₹19,999 paid (Razorpay)</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shrink-0">
                      In Progress
                    </span>
                  </div>

                  {/* Progress Tracker */}
                  <div className="flex flex-col sm:flex-row border border-border rounded-xl overflow-hidden mb-8">
                    <div className="flex-1 p-4 text-center border-b sm:border-b-0 sm:border-r border-border bg-emerald-50 dark:bg-emerald-900/10">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                      <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Due Diligence</div>
                      <div className="text-xs text-muted-foreground mt-1">Completed</div>
                    </div>
                    <div className="flex-1 p-4 text-center border-b sm:border-b-0 sm:border-r border-border bg-amber-50 dark:bg-amber-900/10">
                      <Scale className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                      <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Bid Mgmt</div>
                      <div className="text-xs text-muted-foreground mt-1">In Progress</div>
                    </div>
                    <div className="flex-1 p-4 text-center border-b sm:border-b-0 sm:border-r border-border">
                      <CircleDashed className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Possession</div>
                      <div className="text-xs text-muted-foreground mt-1">Pending</div>
                    </div>
                    <div className="flex-1 p-4 text-center">
                      <CircleDashed className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <div className="text-[11px] font-bold text-foreground uppercase tracking-wider">Loan</div>
                      <div className="text-xs text-muted-foreground mt-1">Pending</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-colors shadow-sm">
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp Team
                    </button>
                    <button className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-foreground text-sm font-bold py-2.5 px-6 rounded-xl transition-colors border border-border">
                      <FileText className="w-4 h-4" />
                      View Due Diligence Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT INFO TAB */}
            {activeTab === "info" && (
              <div className="animate-in fade-in duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground font-display">Account Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage your personal details and settings.</p>
                </div>

                <div className="bg-background rounded-2xl border border-border shadow-sm p-6 sm:p-8">
                  <form className="flex flex-col gap-6" onSubmit={handleSaveDetails}>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 px-4 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                        <input type="email" defaultValue={profile.email} disabled className="h-12 px-4 rounded-xl border border-border bg-secondary/10 text-muted-foreground outline-none text-sm cursor-not-allowed" />
                        <span className="text-xs text-muted-foreground">Contact support to change email.</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-12 px-4 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm" />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">City</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className="h-12 px-4 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm" />
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-6 mt-2">
                      <h3 className="font-bold text-foreground mb-4">KYC Details (Optional)</h3>
                      <p className="text-sm text-muted-foreground mb-6">Providing these helps speed up your service onboarding.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="pan" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PAN Number</label>
                          <input
                            id="pan"
                            type="text"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                            maxLength={10}
                            autoComplete="off"
                            placeholder="ABCDE1234F"
                            className="h-12 px-4 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm uppercase"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="aadhaar" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aadhaar Number</label>
                          <input
                            id="aadhaar"
                            type="text"
                            inputMode="numeric"
                            value={aadhaarNumber}
                            onChange={(e) => setAadhaarNumber(formatAadhaarForDisplay(normaliseAadhaar(e.target.value)))}
                            autoComplete="off"
                            placeholder="1234 5678 9012"
                            className="h-12 px-4 rounded-xl border border-border bg-secondary/30 focus:bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Both are optional and are only visible to you. Leave them blank if you would rather not share them.
                      </p>
                    </div>

                    <div className="border-t border-border pt-6 mt-2 flex justify-end">
                      <button disabled={savingDetails} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold h-12 px-8 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5">
                        {savingDetails ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>
      
    </div>
  )
}
