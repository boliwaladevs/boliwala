"use client"

import { useState } from "react"
import {
  LayoutGrid, Users, UserPlus, Image as ImageIcon, Wallet,
  Copy, Check, CheckCircle2, CircleDashed, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PartnerDashboard } from "@/lib/data/partners"
import type { CommissionSettings } from "@/lib/access/types"

/**
 * The channel partner portal.
 *
 * Every figure on this page used to be hardcoded — ₹31,297 in earnings, 45
 * referrals, 8 subscribers, a Gold tier and a partner called Rahul Mehta, all
 * invented, all served to whoever held the role. It now renders exactly what
 * the database holds for the signed-in partner, which for a new partner is
 * zeros and empty tables. **That is the correct output, not a broken page**, and
 * the copy says so rather than dressing it up.
 *
 * Two sections describe capability that does not exist yet, and both say so
 * plainly instead of pretending:
 *
 *  - **Invite People** cannot send anything. There is no email or WhatsApp
 *    integration in this project. What it does is give the partner their link
 *    and show what happened to the people who used it — which is what the
 *    "Invitation status" gap in MEMORY.md §31.1 actually needed.
 *  - **Marketing Creatives** needs admin-uploaded templates (product spec
 *    §5.11) and image storage. Neither exists, so it is an empty state.
 */
export function PartnerDashboardView({
  partner,
  data,
  commission,
  siteUrl,
}: {
  partner: { name: string; email: string }
  data: PartnerDashboard
  commission: CommissionSettings
  siteUrl: string
}) {
  const [activeView, setActiveView] = useState("dashboard")
  const [toastMessage, setToastMessage] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [copied, setCopied] = useState(false)

  const referralLink = data.referralCode ? `${siteUrl}/?ref=${data.referralCode}` : null

  const showNotification = (msg: string) => {
    setToastMessage(msg)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2200)
  }

  const copyRefLink = () => {
    if (!referralLink) {
      showNotification("No referral code yet — an admin issues one on approval")
      return
    }
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
    showNotification("Referral link copied")
  }

  const inr = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  const initials = partner.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P"

  const tierLabel = data.tier ? `${data.tier[0].toUpperCase()}${data.tier.slice(1)} Partner` : "Tier not assigned"

  const subscriptionCommissions = data.commissions.filter((c) => c.sourceType === "annual_subscription")
  const packageCommissions = data.commissions.filter((c) => c.sourceType === "service_package")
  const sum = (rows: typeof data.commissions) => rows.reduce((total, r) => total + Number(r.commissionAmount), 0)

  const pageTitles: Record<string, { title: string; sub: string }> = {
    dashboard: { title: "Dashboard", sub: "Your referral network at a glance" },
    referrals: { title: "My Referrals", sub: "Everyone you've brought to Boliwala" },
    invite: { title: "Invite People", sub: "Share your link — every signup tracks back to you" },
    creatives: { title: "Marketing Creatives", sub: "Branded assets to share" },
    earnings: { title: "Earnings & Payouts", sub: "Commissions and settlements" },
  }

  const navItems = [
    { id: "dashboard", icon: LayoutGrid, label: "Dashboard", short: "Dash" },
    { id: "referrals", icon: Users, label: "My Referrals", short: "Refs" },
    { id: "invite", icon: UserPlus, label: "Invite People", short: "Invite" },
    { id: "creatives", icon: ImageIcon, label: "Marketing Creatives", short: "Media" },
    { id: "earnings", icon: Wallet, label: "Earnings & Payouts", short: "Earn" },
  ]

  const StatTile = ({ icon, tint, value, label }: { icon: React.ReactNode; tint: string; value: string; label: string }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className={cn("w-[34px] h-[34px] rounded-lg flex items-center justify-center mb-3", tint)}>{icon}</div>
      <div className="font-extrabold text-[25px] leading-none">{value}</div>
      <div className="text-[12.5px] text-slate-500 font-medium mt-1.5">{label}</div>
    </div>
  )

  const Empty = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-[13.5px] text-slate-500 leading-relaxed shadow-sm">
      {children}
    </div>
  )

  const ReferralLinkCard = () => (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
      {referralLink ? (
        <div className="flex flex-col md:flex-row gap-3 items-stretch">
          <div className="flex-1 flex items-center gap-2.5 bg-blue-50 border-[1.5px] border-dashed border-blue-200 rounded-xl px-4 py-3">
            <Copy className="w-[18px] h-[18px] text-blue-600 shrink-0" />
            <span className="font-semibold text-blue-800 text-[14.5px] break-all">{referralLink}</span>
          </div>
          <button onClick={copyRefLink} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-[14px] bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-3 text-[13.5px] text-slate-600">
          <Info className="w-[18px] h-[18px] text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900">No referral code yet</div>
            Your code is issued when an admin approves your application. Until then there is no link to share.
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[250px] bg-white border-r border-slate-200 sticky top-0 h-screen p-5 gap-1.5 shrink-0 z-30">
        <div className="flex items-center gap-2.5 pb-5">
          <div className="w-[34px] h-[34px] rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">B</div>
          <div>
            <div className="font-extrabold text-[18px] leading-tight">Boliwala</div>
            <div className="text-[11px] text-slate-500 font-medium">Partner Portal</div>
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold px-2.5 pt-3.5 pb-1.5">Main</div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "flex items-center gap-2.5 p-[10px_11px] rounded-[10px] text-[14.5px] font-medium w-full text-left transition-colors",
              activeView === item.id ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-600 group",
            )}
          >
            <item.icon className={cn("w-[19px] h-[19px] shrink-0", activeView === item.id ? "text-white" : "text-slate-500 group-hover:text-blue-600")} />
            {item.label}
          </button>
        ))}

        <div className="mt-auto border-t border-slate-200 pt-3.5">
          <div className="flex items-center gap-2.5 p-2 rounded-[10px]">
            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{initials}</div>
            <div className="min-w-0">
              <div className="font-semibold text-[13.5px] text-slate-900 leading-tight truncate">{partner.name}</div>
              <div className={cn("text-[11.5px] font-semibold", data.tier ? "text-amber-600" : "text-slate-400")}>
                {data.tier ? "● " : ""}{tierLabel}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-2 z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn("flex flex-col items-center p-2 rounded-lg", activeView === item.id ? "text-blue-600 bg-blue-50" : "text-slate-500")}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-semibold">{item.short}</span>
          </button>
        ))}
      </div>

      {/* MAIN */}
      <main className="flex-1 flex flex-col pb-20 md:pb-14 min-w-0">
        <header className="bg-white border-b border-slate-200 px-5 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="text-[21px] font-extrabold">{pageTitles[activeView].title}</h1>
            <div className="text-[13px] text-slate-500 mt-0.5">{pageTitles[activeView].sub}</div>
          </div>
          <div className="hidden md:flex items-center gap-2.5">
            <button onClick={() => setActiveView("invite")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[14px] bg-white text-slate-700 border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite People
            </button>
            <button onClick={copyRefLink} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[14px] bg-blue-600 text-white hover:bg-blue-700 transition-colors">
              <Copy className="w-4 h-4" /> Copy Referral Link
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-[1180px] w-full mx-auto flex-1">
          {/* DASHBOARD */}
          {activeView === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
                <StatTile icon={<Users className="w-[18px] h-[18px] text-blue-600" />} tint="bg-blue-50" value={String(data.totals.referrals)} label="Total Referrals" />
                <StatTile icon={<CheckCircle2 className="w-[18px] h-[18px] text-emerald-600" />} tint="bg-emerald-50" value={String(data.totals.converted)} label="Converted" />
                <StatTile icon={<Wallet className="w-[18px] h-[18px] text-amber-600" />} tint="bg-amber-50" value={String(subscriptionCommissions.length)} label="Memberships" />
                <StatTile icon={<Wallet className="w-[18px] h-[18px] text-blue-600" />} tint="bg-blue-50" value={String(packageCommissions.length)} label="Service Packages" />
                <StatTile icon={<Wallet className="w-[18px] h-[18px] text-emerald-600" />} tint="bg-emerald-50" value={inr(data.totals.lifetimeEarned)} label="Lifetime Earnings" />
              </div>

              <div className="flex items-center justify-between mb-4 mt-2">
                <div>
                  <h2 className="text-[16px] font-bold">Your referral link</h2>
                  <div className="text-[12.5px] text-slate-500">Share anywhere — every signup tracks back to you for {commission.attributionDays} days</div>
                </div>
              </div>
              <ReferralLinkCard />

              <h2 className="text-[16px] font-bold mb-4">How you earn</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="font-extrabold text-[24px] text-blue-600">{commission.subscriptionPct}%</div>
                  <div className="text-[13px] text-slate-600 mt-1">of every annual membership a referral buys</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="font-extrabold text-[24px] text-amber-600">{commission.packagePct}%</div>
                  <div className="text-[13px] text-slate-600 mt-1">of every Full Service package a referral buys</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="font-extrabold text-[24px] text-slate-400">—</div>
                  <div className="text-[13px] text-slate-600 mt-1">Success-fee commission is not being tracked yet</div>
                </div>
              </div>

              <h2 className="text-[16px] font-bold mb-4">Recent referrals</h2>
              {data.referrals.length === 0 ? (
                <Empty>
                  Nobody has signed up through your link yet. Share it and the people who join will appear here.
                </Empty>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 px-4 font-bold">Person</th>
                          <th className="p-3 px-4 font-bold">Joined</th>
                          <th className="p-3 px-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.referrals.slice(0, 5).map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 last:border-0">
                            <td className="p-3 px-4 font-semibold text-slate-900">{r.referred?.fullName?.trim() || r.referred?.email || "—"}</td>
                            <td className="p-3 px-4 text-slate-600">{shortDate(r.landedAt)}</td>
                            <td className="p-3 px-4">
                              {r.convertedAt ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold"><CheckCircle2 className="w-4 h-4" /> Converted</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-slate-500"><CircleDashed className="w-4 h-4" /> Signed up</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REFERRALS */}
          {activeView === "referrals" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {data.referrals.length === 0 ? (
                <Empty>
                  No referrals yet. Anyone who creates an account within {commission.attributionDays} days of using your
                  link is attributed to you automatically.
                </Empty>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 px-4 font-bold">Person</th>
                          <th className="p-3 px-4 font-bold">Signed up</th>
                          <th className="p-3 px-4 font-bold">Converted</th>
                          <th className="p-3 px-4 font-bold">Bought</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.referrals.map((r) => (
                          <tr key={r.id} className="border-b border-slate-100 last:border-0">
                            <td className="p-3 px-4 font-semibold text-slate-900">{r.referred?.fullName?.trim() || r.referred?.email || "—"}</td>
                            <td className="p-3 px-4 text-slate-600">{shortDate(r.landedAt)}</td>
                            <td className="p-3 px-4 text-slate-600">{r.convertedAt ? shortDate(r.convertedAt) : "—"}</td>
                            <td className="p-3 px-4 text-slate-600">
                              {r.conversionType === "annual_subscription" ? "Annual membership" : r.conversionType === "service_package" ? "Full Service package" : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INVITE — link, share, and what happened to the people who used it */}
          {activeView === "invite" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ReferralLinkCard />

              {referralLink && (
                <div className="flex flex-wrap gap-2.5 mb-8">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Find bank auction properties on Boliwala: ${referralLink}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[14px] bg-white text-slate-700 border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    Share on WhatsApp
                  </a>
                  <a
                    href={`mailto:?subject=${encodeURIComponent("Bank auction properties on Boliwala")}&body=${encodeURIComponent(`I thought this might be useful: ${referralLink}`)}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[14px] bg-white text-slate-700 border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    Share by email
                  </a>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
                <Info className="w-[18px] h-[18px] text-blue-600 shrink-0 mt-0.5" />
                <div className="text-[13px] text-slate-700 leading-relaxed">
                  Boliwala does not send invitations on your behalf — you share the link yourself, from your own
                  WhatsApp or email. What we track is what happens next, below.
                </div>
              </div>

              <h2 className="text-[16px] font-bold mb-4">Invitation status</h2>
              {data.referrals.length === 0 ? (
                <Empty>Nobody has used your link yet.</Empty>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 px-4 font-bold">Person</th>
                          <th className="p-3 px-4 font-bold">Used your link</th>
                          <th className="p-3 px-4 font-bold">Status</th>
                          <th className="p-3 px-4 font-bold">You earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.referrals.map((r) => {
                          const earned = data.commissions.filter((c) => c.sourceType === r.conversionType).length > 0 && r.convertedAt
                          return (
                            <tr key={r.id} className="border-b border-slate-100 last:border-0">
                              <td className="p-3 px-4 font-semibold text-slate-900">{r.referred?.fullName?.trim() || r.referred?.email || "—"}</td>
                              <td className="p-3 px-4 text-slate-600">{shortDate(r.landedAt)}</td>
                              <td className="p-3 px-4">
                                {r.convertedAt ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold"><CheckCircle2 className="w-4 h-4" /> Bought a plan</span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-slate-500"><CircleDashed className="w-4 h-4" /> Account created</span>
                                )}
                              </td>
                              <td className="p-3 px-4 text-slate-600">{earned ? "Yes — see Earnings" : "Not yet"}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CREATIVES */}
          {activeView === "creatives" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Empty>
                No creatives are available yet. Co-branded templates are uploaded by the Boliwala team and
                personalised with your name, phone and referral link — that library has not been built yet.
                <div className="mt-3 text-slate-600">In the meantime, your referral link works anywhere you share it.</div>
              </Empty>
            </div>
          )}

          {/* EARNINGS */}
          {activeView === "earnings" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
                <StatTile icon={<Wallet className="w-[18px] h-[18px] text-slate-600" />} tint="bg-slate-100" value={inr(data.totals.lifetimeEarned)} label="Lifetime earned" />
                <StatTile icon={<CircleDashed className="w-[18px] h-[18px] text-amber-600" />} tint="bg-amber-50" value={inr(data.totals.accrued)} label="Awaiting approval" />
                <StatTile icon={<CheckCircle2 className="w-[18px] h-[18px] text-blue-600" />} tint="bg-blue-50" value={inr(data.totals.approved)} label="Approved, unpaid" />
                <StatTile icon={<Check className="w-[18px] h-[18px] text-emerald-600" />} tint="bg-emerald-50" value={inr(data.totals.paid)} label="Paid out" />
              </div>

              <h2 className="text-[16px] font-bold mb-4">Earnings breakdown</h2>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-[13.5px] text-slate-600">Annual memberships · {subscriptionCommissions.length} × {commission.subscriptionPct}%</span>
                  <span className="font-bold text-[15px]">{inr(sum(subscriptionCommissions))}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-[13.5px] text-slate-600">Full Service packages · {packageCommissions.length} × {commission.packagePct}%</span>
                  <span className="font-bold text-[15px]">{inr(sum(packageCommissions))}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-[14px] font-semibold">Total</span>
                  <span className="font-extrabold text-[20px]">{inr(data.totals.lifetimeEarned)}</span>
                </div>
              </div>

              <h2 className="text-[16px] font-bold mb-4">Commissions</h2>
              {data.commissions.length === 0 ? (
                <Empty>
                  No commissions yet. One is recorded the moment somebody you referred buys a membership or a
                  service package.
                </Empty>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 px-4 font-bold">Date</th>
                          <th className="p-3 px-4 font-bold">Source</th>
                          <th className="p-3 px-4 font-bold">Sale</th>
                          <th className="p-3 px-4 font-bold">Rate</th>
                          <th className="p-3 px-4 font-bold">You earned</th>
                          <th className="p-3 px-4 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.commissions.map((c) => (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0">
                            <td className="p-3 px-4 text-slate-600">{shortDate(c.createdAt)}</td>
                            <td className="p-3 px-4 text-slate-600">{c.sourceType === "annual_subscription" ? "Annual membership" : c.sourceType === "service_package" ? "Full Service package" : "Success fee"}</td>
                            <td className="p-3 px-4 text-slate-600">{inr(c.grossAmount)}</td>
                            <td className="p-3 px-4 text-slate-600">{c.ratePct}%</td>
                            <td className="p-3 px-4 font-bold text-slate-900">{inr(c.commissionAmount)}</td>
                            <td className="p-3 px-4 capitalize text-slate-600">{c.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <h2 className="text-[16px] font-bold mb-4">Payout history</h2>
              {data.payouts.length === 0 ? (
                <Empty>No payouts yet. Approved commissions are settled by the Boliwala team.</Empty>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13.5px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                          <th className="p-3 px-4 font-bold">Period</th>
                          <th className="p-3 px-4 font-bold">Amount</th>
                          <th className="p-3 px-4 font-bold">Status</th>
                          <th className="p-3 px-4 font-bold">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.payouts.map((p) => (
                          <tr key={p.id} className="border-b border-slate-100 last:border-0">
                            <td className="p-3 px-4 text-slate-600">{shortDate(p.periodStart)} – {shortDate(p.periodEnd)}</td>
                            <td className="p-3 px-4 font-bold text-slate-900">{inr(p.totalAmount)}</td>
                            <td className="p-3 px-4 capitalize text-slate-600">{p.status}</td>
                            <td className="p-3 px-4 text-slate-600">{p.reference || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showToast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[13.5px] font-medium px-4 py-2.5 rounded-xl shadow-lg z-50">
          {toastMessage}
        </div>
      )}
    </div>
  )
}
