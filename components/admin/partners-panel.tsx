"use client"

import { useState } from "react"
import { Th, Td, Pill, RaBtn, TcHead, StatCard, Flbl, Finp, Fsel } from "./ui"
import {
  approvePartnerApplication,
  rejectPartnerApplication,
  setPartnerTier,
  approveCommission,
  payOutApprovedCommissions,
} from "@/app/actions/admin-partners"
import type { AdminPartnerApplicationRow } from "@/lib/data/admin"
import type { AdminPartnerRow, AdminCommissionRow, PartnerTier } from "@/lib/data/partners"
import { useToast } from "@/hooks/use-toast"

const APPLICATION_PILL: Record<AdminPartnerApplicationRow["status"], "gold" | "blue" | "green" | "gray"> = {
  new: "gold",
  contacted: "blue",
  approved: "green",
  rejected: "gray",
}

const COMMISSION_PILL: Record<AdminCommissionRow["status"], "gold" | "blue" | "green"> = {
  accrued: "gold",
  approved: "blue",
  paid: "green",
}

const TIERS: PartnerTier[] = ["associate", "silver", "gold"]

const SOURCE_LABEL: Record<AdminCommissionRow["sourceType"], string> = {
  annual_subscription: "Annual membership",
  service_package: "Full Service package",
  success_fee: "Success fee",
}

/**
 * Channel partners, end to end: the application inbox, the live partners, and
 * the commission approval queue.
 *
 * Everything here writes real rows. Approving an application flips a profile to
 * `channel_partner`, issues a referral code and assigns a tier — the tier is
 * chosen here rather than computed, because the thresholds have not been agreed
 * and inventing them would bake in a business rule nobody signed off.
 */
export function PartnersPanel({
  applications,
  partners,
  commissions,
}: {
  applications: AdminPartnerApplicationRow[]
  partners: AdminPartnerRow[]
  commissions: AdminCommissionRow[]
}) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  // Which application's approve drawer is open, and the tier chosen for it.
  const [approving, setApproving] = useState<AdminPartnerApplicationRow | null>(null)
  const [tier, setTier] = useState<PartnerTier>("associate")

  // Which partner is being paid, and the transfer reference for it.
  const [paying, setPaying] = useState<AdminPartnerRow | null>(null)
  const [reference, setReference] = useState("")

  const inr = (amount: number) => `₹${Math.round(amount).toLocaleString("en-IN")}`
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })

  const run = async (action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>, onOk?: () => void) => {
    setBusy(true)
    const result = await action()
    setBusy(false)
    if (!result.ok) {
      toast({ variant: "destructive", title: "Nothing changed", description: result.error })
      return
    }
    toast({ title: "Done", description: result.message })
    onOk?.()
  }

  const pending = applications.filter((a) => a.status === "new" || a.status === "contacted")
  const accrued = commissions.filter((c) => c.status === "accrued")
  const approvedUnpaid = commissions.filter((c) => c.status === "approved")

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🤝" iconBg="bg-blue-100 dark:bg-blue-500/20" value={partners.length} label="Active Partners" />
        <StatCard icon="📥" iconBg="bg-amber-100 dark:bg-amber-500/20" value={pending.length} label="Applications Pending" />
        <StatCard icon="⏳" iconBg="bg-amber-100 dark:bg-amber-500/20" value={inr(accrued.reduce((t, c) => t + Number(c.commissionAmount), 0))} label="Commission Awaiting Approval" />
        <StatCard icon="💸" iconBg="bg-emerald-100 dark:bg-emerald-500/20" value={inr(approvedUnpaid.reduce((t, c) => t + Number(c.commissionAmount), 0))} label="Approved, Unpaid" />
      </div>

      {approving && (
        <div className="bg-card border-2 border-primary rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <div className="font-display text-[15px] font-bold text-foreground">Approve {approving.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {approving.email} · {approving.city}, {approving.state}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Flbl>Tier</Flbl>
              <Fsel
                value={tier}
                onChange={(v) => setTier(v as PartnerTier)}
                options={TIERS.map((t) => ({ label: t[0].toUpperCase() + t.slice(1), value: t }))}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Approving flips this account to the channel_partner role and issues a referral code. The account must
            already exist — ask them to sign up at <code className="text-[11px]">/partner/login</code> first if it does not.
            Tiers are assigned by hand: the thresholds have not been decided yet.
          </p>
          <div className="flex gap-2 justify-end">
            <RaBtn onClick={() => setApproving(null)}>Cancel</RaBtn>
            <RaBtn primary disabled={busy} onClick={() => run(() => approvePartnerApplication(approving.id, tier), () => setApproving(null))}>
              {busy ? "Approving…" : "Approve"}
            </RaBtn>
          </div>
        </div>
      )}

      {paying && (
        <div className="bg-card border-2 border-primary rounded-xl shadow-sm p-5 space-y-4">
          <div className="font-display text-[15px] font-bold text-foreground">
            Pay {paying.fullName?.trim() || paying.email}
          </div>
          <div>
            <Flbl>Transfer reference (UTR, cheque number…)</Flbl>
            <Finp value={reference} onChange={setReference} placeholder="how this payment can be found in your bank" />
          </div>
          <p className="text-xs text-muted-foreground">
            This records a payment that has already been made outside Boliwala — it does not move money. Every
            approved commission for this partner is settled and marked paid.
          </p>
          <div className="flex gap-2 justify-end">
            <RaBtn onClick={() => setPaying(null)}>Cancel</RaBtn>
            <RaBtn primary disabled={busy} onClick={() => run(() => payOutApprovedCommissions(paying.id, reference), () => { setPaying(null); setReference("") })}>
              {busy ? "Recording…" : "Record payout"}
            </RaBtn>
          </div>
        </div>
      )}

      {/* APPLICATIONS */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead title={<>📥 Applications <span className="text-xs font-normal text-muted-foreground">{pending.length} pending</span></>} />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <Th>Applicant</Th><Th>City</Th><Th>Occupation</Th><Th>Applied</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-[13px] leading-relaxed">
                    No applications yet. The form at <code className="text-xs">/partner</code> writes here.
                  </td>
                </tr>
              ) : applications.map((a) => {
                const awaiting = a.status === "new" || a.status === "contacted"
                return (
                  <tr key={a.id} className={`border-b border-border ${awaiting ? "bg-amber-50/50 dark:bg-amber-500/5" : "hover:bg-muted/30"}`}>
                    <Td>
                      <div className="font-bold text-foreground">{a.name}</div>
                      <div className="text-[11px]">{a.phone} · {a.email}</div>
                    </Td>
                    <Td>{a.city}, {a.state}</Td>
                    <Td>{a.occupation || "—"}</Td>
                    <Td>{shortDate(a.createdAt)}</Td>
                    <Td><Pill type={APPLICATION_PILL[a.status]}>{a.status}</Pill></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        {awaiting ? (
                          <>
                            <RaBtn primary onClick={() => { setApproving(a); setTier("associate") }}>✅ Approve</RaBtn>
                            <RaBtn danger disabled={busy} onClick={() => run(() => rejectPartnerApplication(a.id))}>✕ Reject</RaBtn>
                          </>
                        ) : "—"}
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTIVE PARTNERS */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead title="🤝 Active Partners" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <Th>Partner</Th><Th>Code</Th><Th>Tier</Th><Th>Referrals</Th><Th>Converted</Th><Th>Earned</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground text-[13px] leading-relaxed">
                    No live partners yet. Approving an application above puts one here.
                  </td>
                </tr>
              ) : partners.map((p) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                  <Td>
                    <div className="font-bold text-foreground">{p.fullName?.trim() || "—"}</div>
                    <div className="text-[11px]">{p.email}{p.city ? ` · ${p.city}` : ""}</div>
                  </Td>
                  <Td className="font-mono text-xs">{p.referralCode ?? "—"}</Td>
                  <Td>
                    <Fsel
                      value={p.tier ?? "associate"}
                      onChange={(v) => run(() => setPartnerTier(p.id, v as PartnerTier))}
                      options={TIERS.map((t) => ({ label: t[0].toUpperCase() + t.slice(1), value: t }))}
                    />
                  </Td>
                  <Td>{p.referrals}</Td>
                  <Td>{p.converted}</Td>
                  <Td className="font-bold text-foreground">{inr(p.earned)}</Td>
                  <Td><RaBtn onClick={() => setPaying(p)}>Record payout</RaBtn></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMISSIONS */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead title={<>💰 Commissions <span className="text-xs font-normal text-muted-foreground">{accrued.length} awaiting approval</span></>} />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <Th>Date</Th><Th>Partner</Th><Th>Source</Th><Th>Sale</Th><Th>Rate</Th><Th>Commission</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground text-[13px] leading-relaxed">
                    No commissions yet. One is written automatically when a referred user is granted a membership
                    or a service package in Sales Enquiries.
                  </td>
                </tr>
              ) : commissions.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                  <Td>{shortDate(c.createdAt)}</Td>
                  <Td>
                    <div className="font-bold text-foreground">{c.partner?.fullName?.trim() || c.partner?.email || "—"}</div>
                  </Td>
                  <Td>{SOURCE_LABEL[c.sourceType]}</Td>
                  <Td>{inr(c.grossAmount)}</Td>
                  <Td>{c.ratePct}%</Td>
                  <Td className="font-bold text-foreground">{inr(c.commissionAmount)}</Td>
                  <Td><Pill type={COMMISSION_PILL[c.status]}>{c.status}</Pill></Td>
                  <Td>
                    {c.status === "accrued" ? (
                      <RaBtn primary disabled={busy} onClick={() => run(() => approveCommission(c.id))}>Approve</RaBtn>
                    ) : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
