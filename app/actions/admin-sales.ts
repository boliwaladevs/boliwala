"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPricingSettings } from "@/lib/access/settings"
import { accrueCommissionForPurchase } from "@/lib/data/partners"
import {
  getSalesEnquiries,
  type AdminSalesEnquiryRow,
  type SalesEnquiryFilters,
  type SalesEnquiryStatus,
} from "@/lib/data/admin"

export async function searchSalesEnquiriesAction(filters: SalesEnquiryFilters): Promise<AdminSalesEnquiryRow[]> {
  await requireAdmin()
  return getSalesEnquiries(filters)
}

export async function updateSalesEnquiry(
  id: string,
  updates: { status?: SalesEnquiryStatus; notes?: string },
): Promise<void> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from("contact_sales_enquiries")
    .update({ ...updates, handledBy: actor.userId, updatedAt: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error

  revalidatePath("/admin")
}

export type GrantResult = { ok: true; message: string } | { ok: false; error: string }

/**
 * Writes what an admin did to a user's entitlements.
 *
 * `admin_audit_log` has existed since the Prisma schema and nothing has ever
 * written to it. Granting an entitlement by hand — money taken offline, access
 * opened by a person — is exactly the action it was built for, so it is the
 * first thing recorded there.
 */
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
    entity: "profile",
    entityId,
    after,
  })
}

/**
 * Finds the account an entitlement is being granted to.
 *
 * An enquiry can be submitted by anyone, signed in or not, so there is no
 * guarantee an account exists. Refusing clearly beats creating a shadow
 * profile the person cannot sign into.
 */
async function findProfileByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data } = await admin
    .from("profiles")
    .select('id, "fullName", email, "creditsBalance"')
    .ilike("email", email.trim())
    .maybeSingle()
  return data as { id: string; fullName: string | null; email: string; creditsBalance: number } | null
}

/**
 * Grants an annual subscription, records the payment, and converts the enquiry.
 *
 * This is **the** revenue event before Razorpay exists, and W6's commissions
 * hang off it. Three writes, in this order:
 *
 *   1. `subscriptions` — the entitlement itself. `lib/auth/viewer.ts` reads
 *      exactly this: status `active` with `expiresAt` in the future, which is
 *      what flips a viewer to "subscriber" and unlocks every gated field.
 *   2. `payments` — money was taken, just not by Razorpay. Without this the
 *      revenue KPIs read zero while real money comes in. The razorpay* columns
 *      are null; migration 0015 made that legal.
 *   3. the enquiry moves to `converted`.
 *
 * Not a transaction: PostgREST has no client-side transaction, and the
 * alternative — an RPC — is more machinery than a hand-run admin action with
 * five rows a month justifies. If step 2 or 3 fails the entitlement still
 * exists, which is the safe direction to fail in: the customer has what they
 * paid for and the admin can see the enquiry is still open.
 */
export async function grantSubscription(enquiryId: string, email: string): Promise<GrantResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const profile = await findProfileByEmail(admin, email)
  if (!profile) return { ok: false, error: `No account found for ${email}. Ask them to sign up first, then grant.` }

  const settings = await getPricingSettings()
  const startedAt = new Date()
  const expiresAt = new Date(startedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const subscriptionId = randomUUID()
  const { error: subError } = await admin.from("subscriptions").insert({
    id: subscriptionId,
    userId: profile.id,
    plan: "annual",
    status: "active",
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    amountPaid: settings.annualPrice,
  })
  if (subError) return { ok: false, error: "Couldn't create the subscription" }

  await admin.from("payments").insert({
    id: randomUUID(),
    userId: profile.id,
    type: "subscription",
    amount: settings.annualPrice,
    status: "paid",
  })

  // If this buyer arrived through a channel partner's link, that partner has
  // just earned. This is the revenue event W6 hangs off — there is no other one
  // before Razorpay exists.
  await accrueCommissionForPurchase({
    buyerProfileId: profile.id,
    sourceType: "annual_subscription",
    sourceId: subscriptionId,
    grossAmount: settings.annualPrice,
  })

  await recordAudit(admin, actor.userId, "grant_subscription", profile.id, {
    enquiryId,
    plan: "annual",
    amount: settings.annualPrice,
    expiresAt: expiresAt.toISOString(),
  })

  await updateSalesEnquiry(enquiryId, { status: "converted" })

  return { ok: true, message: `Annual membership active for ${profile.email} until ${expiresAt.toLocaleDateString("en-IN")}` }
}

/**
 * Grants a Full Service package and records the payment, same shape as
 * `grantSubscription`. The package lands as `pending` — it is work that has not
 * started, and the Service Pipeline reads that status.
 */
export async function grantServicePackage(enquiryId: string, email: string): Promise<GrantResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  const profile = await findProfileByEmail(admin, email)
  if (!profile) return { ok: false, error: `No account found for ${email}. Ask them to sign up first, then grant.` }

  const settings = await getPricingSettings()

  const packageId = randomUUID()
  const { error: pkgError } = await admin.from("service_packages").insert({
    id: packageId,
    userId: profile.id,
    status: "pending",
    amountPaid: settings.servicePackagePrice,
    successFeePct: settings.successFeePct,
  })
  if (pkgError) return { ok: false, error: "Couldn't create the service package" }

  await admin.from("payments").insert({
    id: randomUUID(),
    userId: profile.id,
    type: "service_package",
    amount: settings.servicePackagePrice,
    status: "paid",
  })

  await accrueCommissionForPurchase({
    buyerProfileId: profile.id,
    sourceType: "service_package",
    sourceId: packageId,
    grossAmount: settings.servicePackagePrice,
  })

  await recordAudit(admin, actor.userId, "grant_service_package", profile.id, {
    enquiryId,
    amount: settings.servicePackagePrice,
    successFeePct: settings.successFeePct,
  })

  await updateSalesEnquiry(enquiryId, { status: "converted" })

  return { ok: true, message: `Service package created for ${profile.email} — it is now in the Service Pipeline` }
}

/**
 * Adds credits to an account.
 *
 * Deliberately **not** a payment: credits are granted as goodwill or a
 * correction far more often than they are sold, and `CreditReason` already has
 * `admin_adjust` for exactly this. The ledger row carries `balanceAfter` so the
 * history stays reconstructable, matching how the unlock flow writes it.
 *
 * The enquiry is left alone — a few credits are not a conversion, and marking
 * one converted would overstate the pipeline.
 */
export async function grantCredits(enquiryId: string, email: string, credits: number): Promise<GrantResult> {
  const actor = await requireAdmin()
  const admin = createAdminClient()

  if (!Number.isInteger(credits) || credits <= 0) return { ok: false, error: "Credits must be a whole number above zero" }

  const profile = await findProfileByEmail(admin, email)
  if (!profile) return { ok: false, error: `No account found for ${email}. Ask them to sign up first, then grant.` }

  const balanceAfter = profile.creditsBalance + credits

  const { error: profileError } = await admin
    .from("profiles")
    .update({ creditsBalance: balanceAfter })
    .eq("id", profile.id)
  if (profileError) return { ok: false, error: "Couldn't update the credit balance" }

  await admin.from("credit_transactions").insert({
    id: randomUUID(),
    userId: profile.id,
    delta: credits,
    reason: "admin_adjust",
    balanceAfter,
  })

  await recordAudit(admin, actor.userId, "grant_credits", profile.id, { enquiryId, credits, balanceAfter })

  revalidatePath("/admin")
  return { ok: true, message: `${credits} credit${credits === 1 ? "" : "s"} added — ${profile.email} now has ${balanceAfter}` }
}
