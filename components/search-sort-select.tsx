"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

const SORT_OPTIONS = [
  { value: "auction_asc", label: "Auction Date (Soonest)" },
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Recently Added" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

export function SearchSortSelect({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      aria-label="Sort results"
      className="h-[38px] rounded-[10px] border border-line bg-paper px-3 text-sm text-ink outline-none transition-colors focus:border-brand"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
