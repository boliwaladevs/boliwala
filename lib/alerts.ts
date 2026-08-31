import type { AlertFilters } from "@/lib/data/alerts"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  agricultural: "Agricultural",
  mixed_use: "Mixed use",
}

const POSSESSION_LABELS: Record<string, string> = {
  physical: "Physical possession",
  symbolic: "Symbolic possession",
}

const WINDOW_LABELS: Record<string, string> = {
  week: "Next 7 days",
  month: "Next 30 days",
}

/**
 * Narrows a set of search params down to the filters an alert should match on.
 *
 * Paging and sort are dropped deliberately: "page 2, cheapest first" describes
 * how someone was browsing, not what they want to hear about. Keeping them
 * would also make two identical alerts look different.
 */
export function alertFiltersFromSearch(params: URLSearchParams): AlertFilters {
  const filters: AlertFilters = {}

  const q = params.get("q")?.trim()
  const location = params.get("location")?.trim()
  const propertyType = params.get("propertyType")
  const possession = params.get("possession")
  const auctionWindow = params.get("auctionWindow")
  const minPrice = Number(params.get("minPrice"))
  const maxPrice = Number(params.get("maxPrice"))
  const lenderIds = params.getAll("lender").filter(Boolean)

  if (q) filters.q = q
  if (location) filters.location = location
  if (propertyType && propertyType in PROPERTY_TYPE_LABELS) filters.propertyType = propertyType
  if (possession && possession in POSSESSION_LABELS) filters.possession = possession
  if (auctionWindow === "week" || auctionWindow === "month") filters.auctionWindow = auctionWindow
  if (Number.isFinite(minPrice) && minPrice > 0) filters.minPrice = minPrice
  if (Number.isFinite(maxPrice) && maxPrice > 0) filters.maxPrice = maxPrice
  if (lenderIds.length > 0) filters.lenderIds = lenderIds

  return filters
}

/** Rebuilds a `/search` query string from stored filters, so a saved alert is clickable. */
export function searchHrefFromAlertFilters(filters: AlertFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.location) params.set("location", filters.location)
  if (filters.propertyType) params.set("propertyType", filters.propertyType)
  if (filters.possession) params.set("possession", filters.possession)
  if (filters.auctionWindow) params.set("auctionWindow", filters.auctionWindow)
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice))
  for (const id of filters.lenderIds ?? []) params.append("lender", id)
  const qs = params.toString()
  return qs ? `/search?${qs}` : "/search"
}

/**
 * Human-readable chips for a saved alert. Lender ids are resolved by the caller
 * where names are available; unresolved ids are shown as a count rather than
 * as raw UUIDs.
 */
export function describeAlertFilters(
  filters: AlertFilters,
  lenderNames?: Map<string, string>,
): string[] {
  const chips: string[] = []

  if (filters.location) chips.push(filters.location)
  if (filters.q) chips.push(`"${filters.q}"`)
  if (filters.propertyType) chips.push(PROPERTY_TYPE_LABELS[filters.propertyType] ?? filters.propertyType)
  if (filters.possession) chips.push(POSSESSION_LABELS[filters.possession] ?? filters.possession)
  if (filters.auctionWindow) chips.push(WINDOW_LABELS[filters.auctionWindow])

  if (filters.minPrice && filters.maxPrice) {
    chips.push(`${compactINR(filters.minPrice)}–${compactINR(filters.maxPrice)}`)
  } else if (filters.minPrice) {
    chips.push(`Above ${compactINR(filters.minPrice)}`)
  } else if (filters.maxPrice) {
    chips.push(`Under ${compactINR(filters.maxPrice)}`)
  }

  for (const id of filters.lenderIds ?? []) {
    const name = lenderNames?.get(id)
    if (name) chips.push(name)
  }
  const unresolved = (filters.lenderIds ?? []).filter((id) => !lenderNames?.has(id)).length
  if (unresolved > 0) chips.push(`${unresolved} lender${unresolved > 1 ? "s" : ""}`)

  if (chips.length === 0) chips.push("All auctions")
  return chips
}

/** Lakh/crore short form — ₹85L, ₹1.85Cr — for chips where full formatting is too long. */
function compactINR(amount: number): string {
  if (amount >= 10000000) {
    const cr = amount / 10000000
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2).replace(/\.?0+$/, "")}Cr`
  }
  if (amount >= 100000) {
    const l = amount / 100000
    return `₹${l % 1 === 0 ? l : l.toFixed(1).replace(/\.0$/, "")}L`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}
