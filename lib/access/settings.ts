import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { PricingSettings } from "./types"

/** Live pricing from the settings table — never hardcode these values. */
export async function getPricingSettings(): Promise<PricingSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("settings").select("key, value")
  if (error) throw error

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value as number]))

  return {
    freeSignupCredits: byKey.get("free_signup_credits") ?? 5,
    annualPrice: byKey.get("annual_price") ?? 999,
    servicePackagePrice: byKey.get("service_package_price") ?? 9999,
    successFeePct: byKey.get("success_fee_pct") ?? 1,
    creditCost: {
      flat_floor: byKey.get("credit_cost_flat_floor") ?? 1,
      inspection: byKey.get("credit_cost_inspection") ?? 1,
      officer_contact: byKey.get("credit_cost_officer_contact") ?? 1,
    },
  }
}
