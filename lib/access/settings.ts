import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { CommissionSettings, PricingSettings } from "./types"

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

/**
 * Live commission configuration. Same rule as pricing: never hardcode a rate.
 *
 * The fallbacks are the client's confirmed rates rather than zero, so a missing
 * settings row cannot silently stop partners earning.
 */
export async function getCommissionSettings(): Promise<CommissionSettings> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("settings").select("key, value")
  if (error) throw error

  const byKey = new Map((data ?? []).map((row) => [row.key, row.value as number | null]))
  const num = (key: string, fallback: number) => {
    const value = byKey.get(key)
    return typeof value === "number" ? value : fallback
  }
  const nullable = (key: string) => {
    const value = byKey.get(key)
    return typeof value === "number" ? value : null
  }

  return {
    subscriptionPct: num("commission_rate_subscription", 10),
    packagePct: num("commission_rate_package", 15),
    successFeePct: num("commission_rate_success_fee", 0),
    silverMinConversions: nullable("partner_tier_silver_min"),
    goldMinConversions: nullable("partner_tier_gold_min"),
    attributionDays: num("referral_attribution_days", 30),
  }
}
