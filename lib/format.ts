export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso))
}
