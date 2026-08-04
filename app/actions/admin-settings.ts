"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { updatePricingSettings, type EditablePricingSettings } from "@/lib/data/admin"

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
