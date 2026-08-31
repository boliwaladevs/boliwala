import "server-only"

import { createClient } from "@/lib/supabase/server"

/**
 * A saved search alert. `filters` is the same shape `parseSearchFilters`
 * produces, minus paging — see `alertFiltersFromSearch` in lib/alerts.ts.
 */
export interface AlertSubscription {
  id: string
  email: string | null
  whatsapp: string | null
  filters: AlertFilters
  frequency: string
  isActive: boolean
  createdAt: string
}

export interface AlertFilters {
  q?: string
  location?: string
  propertyType?: string
  possession?: string
  lenderIds?: string[]
  minPrice?: number
  maxPrice?: number
  auctionWindow?: "week" | "month"
}

/** A signed-in user's saved alerts, newest first. RLS limits this to their own. */
export async function getAlertSubscriptions(userId: string): Promise<AlertSubscription[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("alert_subscriptions")
    .select("id, email, whatsapp, filters, frequency, isActive, createdAt")
    .eq("userId", userId)
    .order("createdAt", { ascending: false })

  if (error) throw error

  return ((data ?? []) as AlertSubscription[]).map((row) => ({
    ...row,
    // Older rows predate the filters column being written to, so they can hold
    // null rather than an object.
    filters: row.filters ?? {},
  }))
}
