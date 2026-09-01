"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import type { PartnerTier } from "@/lib/data/partners"

export type PartnerActionResult = { ok: true; message: string } | { ok: false; error: string }

/**
 * A referral code a person can read out over the phone.
 *
 * No 0/O or 1/I — a partner will dictate this to somebody, and a code that is
 * ambiguous out loud costs a referral. Eight characters over a 32-symbol
 * alphabet is ~40 bits, which is far more than a business with hundreds of
 * partners needs, and the unique constraint on the column catches the rest.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateReferralCode(): string {
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return code
}

async function recordAudit(
  admin: ReturnType<typeof createAdminClient>,
  adminId: string,
  action: string,
  entityId: string,
  after: Record<string, unknown>,
): Promise<void> {
  await admin.from("admin_audit_log").insert({
    id: randomUUID(),
    adminId,
    action,
    entity: "partner",
    entityId,
    after,
  })
}

/**
 * Approves a channel partner application: the person becomes a partner, gets a
 * referral code, and is assigned a tier.
 *
 * The tier is chosen by the admin, not computed. Product spec §5.9 describes it
 * that way, and the thresholds that would let it be automatic have not been
 * decided — inventing them here would bake a business rule nobody agreed to.
 *
 * Requires an existing account with that email, for the same reason a grant
 * does: the role and the code hang off a profile, and there is no profile
 * without a signup. Refusing says so rather than half-approving.
 */
export async function approvePartnerApplication(
  applicationId: string,
  tier: PartnerTier,
): Promise<PartnerActionResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { data: application } = await admin
    .from("channel_partner_applications")
    .select("id, name, email, status")
    .eq("id", applicationId)
    .maybeSingle()

  if (!application) return { ok: false, error: "That application no longer exists" }

  const app = application as { id: string; name: string; email: string; status: string }

  const { data: profile } = await admin
    .from("profiles")
    .select('id, email, role, "referralCode"')
    .ilike("email", app.email)
    .maybeSingle()

  if (!profile) {
    return {
      ok: false,
      error: `${app.email} has no account yet. Ask them to sign up at /partner/login first, then approve.`,
    }
  }

  const existing = profile as { id: string; email: string; role: string; referralCode: string | null }

  // Re-approving must not hand out a second code — links already in circulation
  // carry the first one.
  const referralCode = existing.referralCode ?? generateReferralCode()

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "channel_partner", referralCode, partnerTier: tier })
    .eq("id", existing.id)

  if (profileError) {
    // The only realistic cause is the unique index on referralCode colliding.
    return { ok: false, error: "Couldn't approve — try again" }
  }

  await admin.from("channel_partner_applications").update({ status: "approved" }).eq("id", app.id)

  await recordAudit(admin, actor.userId, "approve_partner", existing.id, {
    applicationId: app.id,
    email: existing.email,
    tier,
    referralCode,
  })

  revalidatePath("/admin")
  return { ok: true, message: `${app.name} is a ${tier} partner. Referral code: ${referralCode}` }
}

/**
 * Rejects an application. Deliberately does not touch the person's account:
 * they keep whatever role they already had, and a rejected applicant is still a
 * customer.
 */
export async function rejectPartnerApplication(applicationId: string): Promise<PartnerActionResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from("channel_partner_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId)

  if (error) return { ok: false, error: "Couldn't update the application" }

  await recordAudit(admin, actor.userId, "reject_partner_application", applicationId, {})
  revalidatePath("/admin")
  return { ok: true, message: "Application rejected" }
}

/** Moves a partner's tier after approval, when their volume earns it. */
export async function setPartnerTier(partnerId: string, tier: PartnerTier): Promise<PartnerActionResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from("profiles").update({ partnerTier: tier }).eq("id", partnerId)
  if (error) return { ok: false, error: "Couldn't change the tier" }

  await recordAudit(admin, actor.userId, "set_partner_tier", partnerId, { tier })
  revalidatePath("/admin")
  return { ok: true, message: `Tier set to ${tier}` }
}

/**
 * Approves a commission: `accrued` → `approved`.
 *
 * Two stages on purpose. A commission accrues automatically the moment a
 * referred customer pays, but somebody has to agree it is owed before it can be
 * paid — a refunded or disputed sale is caught here rather than after the money
 * has left.
 */
export async function approveCommission(commissionId: string): Promise<PartnerActionResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from("partner_commissions")
    .update({ status: "approved", approvedAt: new Date().toISOString(), approvedBy: actor.userId })
    .eq("id", commissionId)
    .eq("status", "accrued")

  if (error) return { ok: false, error: "Couldn't approve that commission" }

  await recordAudit(admin, actor.userId, "approve_commission", commissionId, {})
  revalidatePath("/admin")
  return { ok: true, message: "Commission approved" }
}

/**
 * Pays out everything approved for one partner, as a single payout record.
 *
 * A payout is created *from* the commissions it covers rather than typed in by
 * hand, so the two can never disagree about the amount. The period is the span
 * of the commissions actually included.
 *
 * `reference` is whatever identifies the transfer outside this system — a UTR,
 * a cheque number. There is no payment integration, and this does not pretend
 * to move money: it records that money was moved.
 */
export async function payOutApprovedCommissions(
  partnerId: string,
  reference: string,
): Promise<PartnerActionResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { data: rows } = await admin
    .from("partner_commissions")
    .select('id, "commissionAmount", "createdAt"')
    .eq("partnerId", partnerId)
    .eq("status", "approved")
    .order("createdAt", { ascending: true })

  const approved = (rows ?? []) as { id: string; commissionAmount: number; createdAt: string }[]
  if (approved.length === 0) return { ok: false, error: "Nothing approved is waiting to be paid" }

  const total = approved.reduce((sum, r) => sum + Number(r.commissionAmount), 0)
  const payoutId = randomUUID()
  const now = new Date().toISOString()

  const { error: payoutError } = await admin.from("partner_payouts").insert({
    id: payoutId,
    partnerId,
    periodStart: approved[0].createdAt,
    periodEnd: approved[approved.length - 1].createdAt,
    totalAmount: total,
    status: "paid",
    paidAt: now,
    reference: reference.trim() || null,
  })
  if (payoutError) return { ok: false, error: "Couldn't record the payout" }

  await admin
    .from("partner_commissions")
    .update({ status: "paid", payoutId })
    .in("id", approved.map((r) => r.id))

  await recordAudit(admin, actor.userId, "pay_partner", partnerId, {
    payoutId,
    total,
    commissions: approved.length,
    reference,
  })

  revalidatePath("/admin")
  return { ok: true, message: `Paid ₹${total.toLocaleString("en-IN")} across ${approved.length} commission${approved.length === 1 ? "" : "s"}` }
}
