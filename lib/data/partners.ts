import "server-only"

import { randomUUID } from "node:crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCommissionSettings } from "@/lib/access/settings"

export type CommissionSource = "annual_subscription" | "service_package" | "success_fee"
export type CommissionStatus = "accrued" | "approved" | "paid"
export type PayoutStatus = "pending" | "paid"
export type PartnerTier = "associate" | "silver" | "gold"

export interface PartnerCommissionRow {
  id: string
  sourceType: CommissionSource
  grossAmount: number
  ratePct: number
  commissionAmount: number
  status: CommissionStatus
  createdAt: string
}

export interface PartnerPayoutRow {
  id: string
  periodStart: string
  periodEnd: string
  totalAmount: number
  status: PayoutStatus
  paidAt: string | null
  reference: string | null
}

export interface PartnerReferralRow {
  id: string
  landedAt: string
  convertedAt: string | null
  conversionType: CommissionSource | null
  referred: { fullName: string | null; email: string; createdAt: string } | null
}

export interface PartnerDashboard {
  referralCode: string | null
  tier: PartnerTier | null
  referrals: PartnerReferralRow[]
  commissions: PartnerCommissionRow[]
  payouts: PartnerPayoutRow[]
  totals: {
    referrals: number
    converted: number
    /** Everything earned, whatever stage it is at. */
    lifetimeEarned: number
    /** Earned but not yet approved by an admin. */
    accrued: number
    /** Approved and awaiting a payout. */
    approved: number
    paid: number
  }
}

/**
 * Everything one partner's dashboard shows, in one call.
 *
 * Read with the service-role client after the caller has established who the
 * partner is. The RLS policies in 0018 scope a partner to their own rows if
 * they ever query directly; this path does not rely on that, so the `partnerId`
 * argument must never come from anything the browser supplies.
 *
 * A brand new partner gets zeros and empty lists, and that is the correct
 * answer — not a reason to invent a number.
 */
export async function getPartnerDashboard(partnerId: string): Promise<PartnerDashboard> {
  const admin = createAdminClient()

  const [profile, referrals, commissions, payouts] = await Promise.all([
    admin.from("profiles").select('"referralCode", "partnerTier"').eq("id", partnerId).single(),
    admin
      .from("partner_referrals")
      .select('id, "landedAt", "convertedAt", "conversionType", referred:profiles!partner_referrals_referredProfileId_fkey("fullName", email, "createdAt")')
      .eq("partnerId", partnerId)
      .order("landedAt", { ascending: false }),
    admin
      .from("partner_commissions")
      .select('id, "sourceType", "grossAmount", "ratePct", "commissionAmount", status, "createdAt"')
      .eq("partnerId", partnerId)
      .order("createdAt", { ascending: false }),
    admin
      .from("partner_payouts")
      .select('id, "periodStart", "periodEnd", "totalAmount", status, "paidAt", reference')
      .eq("partnerId", partnerId)
      .order("periodEnd", { ascending: false }),
  ])

  const referralRows = (referrals.data ?? []) as unknown as PartnerReferralRow[]
  const commissionRows = (commissions.data ?? []) as unknown as PartnerCommissionRow[]
  const payoutRows = (payouts.data ?? []) as unknown as PartnerPayoutRow[]

  const sum = (rows: PartnerCommissionRow[]) =>
    rows.reduce((total, row) => total + Number(row.commissionAmount), 0)

  return {
    referralCode: (profile.data as { referralCode: string | null } | null)?.referralCode ?? null,
    tier: (profile.data as { partnerTier: PartnerTier | null } | null)?.partnerTier ?? null,
    referrals: referralRows,
    commissions: commissionRows,
    payouts: payoutRows,
    totals: {
      referrals: referralRows.length,
      converted: referralRows.filter((r) => r.convertedAt !== null).length,
      lifetimeEarned: sum(commissionRows),
      accrued: sum(commissionRows.filter((c) => c.status === "accrued")),
      approved: sum(commissionRows.filter((c) => c.status === "approved")),
      paid: sum(commissionRows.filter((c) => c.status === "paid")),
    },
  }
}

/**
 * Records a partner's commission when a referred user pays for something.
 *
 * Called from the W2.5 grant actions, which are the only revenue events that
 * exist before Razorpay. Does nothing — quietly, and correctly — when the buyer
 * was never referred, which will be the common case.
 *
 * The rate is read live and then **stored on the row**. Product spec §5.10:
 * changing a rate applies to new commissions only, so a commission must carry
 * the rate it was earned at rather than re-deriving it on read.
 *
 * Never throws. A bookkeeping failure must not roll back a customer's paid
 * entitlement; the grant has already happened by the time this runs.
 */
export async function accrueCommissionForPurchase(input: {
  buyerProfileId: string
  sourceType: Exclude<CommissionSource, "success_fee">
  sourceId: string
  grossAmount: number
}): Promise<void> {
  try {
    const admin = createAdminClient()

    const { data: referral } = await admin
      .from("partner_referrals")
      .select('id, "partnerId", "convertedAt"')
      .eq("referredProfileId", input.buyerProfileId)
      .maybeSingle()

    if (!referral) return

    const settings = await getCommissionSettings()
    const ratePct =
      input.sourceType === "annual_subscription" ? settings.subscriptionPct : settings.packagePct

    // A rate of zero is a decision, not a bug — but writing a ₹0 commission row
    // would only clutter the partner's ledger, so skip it.
    if (!ratePct) return

    const commissionAmount = Math.round((input.grossAmount * ratePct) / 100)

    await admin.from("partner_commissions").insert({
      id: randomUUID(),
      partnerId: (referral as { partnerId: string }).partnerId,
      referralId: (referral as { id: string }).id,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      grossAmount: input.grossAmount,
      ratePct,
      commissionAmount,
    })

    // The first purchase is what converts a referral. Later purchases by the
    // same person still earn, but do not rewrite when the conversion happened.
    if (!(referral as { convertedAt: string | null }).convertedAt) {
      await admin
        .from("partner_referrals")
        .update({ convertedAt: new Date().toISOString(), conversionType: input.sourceType })
        .eq("id", (referral as { id: string }).id)
    }
  } catch {
    // Deliberately swallowed — see the docblock.
  }
}

export interface AdminPartnerRow {
  id: string
  fullName: string | null
  email: string
  phone: string | null
  city: string | null
  referralCode: string | null
  tier: PartnerTier | null
  referrals: number
  converted: number
  earned: number
}

/**
 * Live channel partners for the admin panel — the accounts, not the
 * applications. `getPartnerApplications()` in lib/data/admin.ts still covers
 * the inbox side; this is who is actually operating.
 */
export async function getAdminPartners(): Promise<AdminPartnerRow[]> {
  const admin = createAdminClient()

  const [profiles, referrals, commissions] = await Promise.all([
    admin
      .from("profiles")
      .select('id, "fullName", email, phone, city, "referralCode", "partnerTier"')
      .eq("role", "channel_partner")
      .order("createdAt", { ascending: false }),
    admin.from("partner_referrals").select('"partnerId", "convertedAt"'),
    admin.from("partner_commissions").select('"partnerId", "commissionAmount"'),
  ])

  const referralRows = (referrals.data ?? []) as { partnerId: string; convertedAt: string | null }[]
  const commissionRows = (commissions.data ?? []) as { partnerId: string; commissionAmount: number }[]

  return ((profiles.data ?? []) as unknown as {
    id: string
    fullName: string | null
    email: string
    phone: string | null
    city: string | null
    referralCode: string | null
    partnerTier: PartnerTier | null
  }[]).map((p) => ({
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    city: p.city,
    referralCode: p.referralCode,
    tier: p.partnerTier,
    referrals: referralRows.filter((r) => r.partnerId === p.id).length,
    converted: referralRows.filter((r) => r.partnerId === p.id && r.convertedAt !== null).length,
    earned: commissionRows
      .filter((c) => c.partnerId === p.id)
      .reduce((total, c) => total + Number(c.commissionAmount), 0),
  }))
}

export interface AdminCommissionRow {
  id: string
  partnerId: string
  sourceType: CommissionSource
  grossAmount: number
  ratePct: number
  commissionAmount: number
  status: CommissionStatus
  createdAt: string
  partner: { fullName: string | null; email: string } | null
}

/** Every commission, newest first, for the admin approval queue. */
export async function getAdminCommissions(limit = 200): Promise<AdminCommissionRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("partner_commissions")
    .select('id, "partnerId", "sourceType", "grossAmount", "ratePct", "commissionAmount", status, "createdAt", partner:profiles!partner_commissions_partnerId_fkey("fullName", email)')
    .order("createdAt", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as AdminCommissionRow[]
}
