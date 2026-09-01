"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { updatePricingSettings, updateCommissionSettings, type EditablePricingSettings, type EditableCommissionSettings } from "@/lib/data/admin"

export async function updatePricingSettingsAction(values: EditablePricingSettings): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin()

  if (values.freeSignupCredits < 0 || values.annualPrice < 0 || values.servicePackagePrice < 0 || values.successFeePct < 0) {
    return { ok: false, error: "Values can't be negative" }
  }

  try {
    await updatePricingSettings(values, admin.userId)
  } catch {
    return { ok: false, error: "Couldn't save settings" }
  }

  // Revalidate every customer-facing surface that reads these settings live.
  revalidatePath("/pricing")
  revalidatePath("/services")
  revalidatePath("/listing/[slug]", "page")
  revalidatePath("/profile")
  revalidatePath("/admin")

  return { ok: true }
}

/**
 * Saves the channel partner commission configuration.
 *
 * Rates are validated as percentages, not as free numbers: a 400% commission is
 * a typo, and the cost of catching it here is one comparison.
 *
 * Tier minimums may be left blank. Null means "not decided yet", which is the
 * truth today, and is why they are not coerced to 0 — a 0 would read as "every
 * partner qualifies for Gold".
 */
export async function updateCommissionSettingsAction(
  values: EditableCommissionSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin()

  for (const pct of [values.subscriptionPct, values.packagePct, values.successFeePct]) {
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return { ok: false, error: "Commission rates must be between 0 and 100%" }
    }
  }
  if (values.attributionDays < 1 || values.attributionDays > 365) {
    return { ok: false, error: "The attribution window must be between 1 and 365 days" }
  }
  for (const min of [values.silverMinConversions, values.goldMinConversions]) {
    if (min !== null && (!Number.isInteger(min) || min < 0)) {
      return { ok: false, error: "Tier minimums must be whole numbers, or left blank" }
    }
  }

  try {
    await updateCommissionSettings(values, admin.userId)
  } catch {
    return { ok: false, error: "Couldn't save commission settings" }
  }

  revalidatePath("/admin")
  revalidatePath("/partner/dashboard")

  return { ok: true }
}
