export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Reserve price per sq ft, e.g. "₹7,222/sq.ft".
 *
 * Returns null rather than a placeholder when the area is unknown — most
 * listings have no `areaSqft`, and "₹0/sq.ft" or "—" reads as a real figure.
 * Callers hide the line entirely on null.
 */
export function reservePricePerSqft(reservePrice: number, areaSqft: number | null | undefined): string | null {
  if (!areaSqft || areaSqft <= 0) return null
  if (!reservePrice || reservePrice <= 0) return null
  return `${formatINR(Math.round(reservePrice / areaSqft))}/sq.ft`
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso))
}
