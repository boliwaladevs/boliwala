"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchParamsInput } from "@/lib/data/listings"

interface Lender {
  id: string
  name: string
  shortName: string
}

interface SearchSectionProps {
  lenders?: Lender[]
  initialParams?: SearchParamsInput
}

function firstParam(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? ""
}

const LABEL = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink2"
const FIELD =
  "h-[46px] w-full rounded-field border border-line bg-surface px-3.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink2/70 focus:border-brand"

function Radio({ checked, tone = "brand" }: { checked: boolean; tone?: "brand" | "pos" }) {
  return (
    <span
      className={cn(
        "mt-px h-4 w-4 shrink-0 rounded-full transition-all",
        checked
          ? tone === "brand"
            ? "border-[5px] border-brand shadow-[inset_0_0_0_2px_var(--paper)]"
            : "border-[5px] border-pos shadow-[inset_0_0_0_2px_var(--paper)]"
          : "border-[1.5px] border-line",
      )}
    />
  )
}

export function SearchSection({ lenders = [], initialParams = {} }: SearchSectionProps = {}) {
  const router = useRouter()

  const [location, setLocation] = useState(firstParam(initialParams.location))
  const [keyword, setKeyword] = useState(firstParam(initialParams.q))
  const [minPrice, setMinPrice] = useState(firstParam(initialParams.minPrice))
  const [maxPrice, setMaxPrice] = useState(firstParam(initialParams.maxPrice))
  const [lender, setLender] = useState(firstParam(initialParams.lender))
  const [propertyType, setPropertyType] = useState(firstParam(initialParams.propertyType) || "all")
  const [possessionType, setPossessionType] = useState(firstParam(initialParams.possession) || "all")

  const propertyTypes = [
    { id: "all", title: "All Types", desc: "Browse everything" },
    { id: "residential", title: "Residential", desc: "Flats, Villas, Bungalows" },
    { id: "commercial", title: "Commercial", desc: "Offices, Shops" },
    { id: "industrial", title: "Industrial", desc: "Factories, Warehouses" },
    { id: "agricultural", title: "Agricultural", desc: "Farms, Plots, Land" },
    { id: "mixed_use", title: "Mixed Use", desc: "Multi-purpose" },
  ]

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set("location", location)
    if (keyword) params.set("q", keyword)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    if (lender) params.set("lender", lender)
    if (propertyType !== "all") params.set("propertyType", propertyType)
    if (possessionType !== "all") params.set("possession", possessionType)
    const qs = params.toString()
    router.push(qs ? `/search?${qs}` : "/search")
  }

  const handleReset = () => {
    setLocation("")
    setKeyword("")
    setMinPrice("")
    setMaxPrice("")
    setLender("")
    setPropertyType("all")
    setPossessionType("all")
    router.push("/search")
  }

  return (
    <div id="search" className="rounded-panel border border-line bg-paper p-5 shadow-panel md:p-6">
      <h2 className="mb-5 font-serif text-[26px] font-semibold tracking-[-0.02em] text-ink">Find Your Ideal Property</h2>

      <div className="flex flex-col gap-4">
        {/* Location & Keyword */}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <div>
            <label className={LABEL} htmlFor="search-location">
              Location
            </label>
            <input
              id="search-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter City, Area, or Locality"
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="search-keyword">
              Keyword
            </label>
            <input
              id="search-keyword"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Building name, Road, or Street"
              className={FIELD}
            />
          </div>
        </div>

        {/* Price Range & Lender */}
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <div>
            <label className={LABEL} htmlFor="search-min-price">
              Price Range (₹)
            </label>
            <div className="flex gap-2">
              <input
                id="search-min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min Price"
                className={cn(FIELD, "tabular-nums")}
              />
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max Price"
                aria-label="Max Price"
                className={cn(FIELD, "tabular-nums")}
              />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="search-lender">
              Lender Name
            </label>
            <select id="search-lender" value={lender} onChange={(e) => setLender(e.target.value)} className={FIELD}>
              <option value="">All Lenders</option>
              {lenders.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Property Type */}
        <div className="rounded-block bg-surface p-4">
          <span className={LABEL}>Property Type</span>
          <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
            {propertyTypes.map((type) => (
              <label
                key={type.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-field border px-3.5 py-3 transition-colors",
                  propertyType === type.id ? "border-brand bg-brand-soft" : "border-line bg-paper hover:border-brand/40",
                )}
              >
                <input
                  type="radio"
                  name="propertyType"
                  className="sr-only"
                  checked={propertyType === type.id}
                  onChange={() => setPropertyType(type.id)}
                />
                <Radio checked={propertyType === type.id} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{type.title}</span>
                  <span className="mt-0.5 block text-xs text-ink2">{type.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Possession Type */}
        <div className="rounded-block border border-pos-line bg-pos-soft p-4">
          <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-pos">Possession Type</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Possession" },
              { id: "physical", label: "Physical" },
              { id: "symbolic", label: "Symbolic" },
            ].map((type) => (
              <label
                key={type.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-pill border px-4 transition-colors",
                  possessionType === type.id ? "border-pos bg-paper" : "border-transparent hover:bg-paper/60",
                )}
              >
                <input
                  type="radio"
                  name="possessionType"
                  className="sr-only"
                  checked={possessionType === type.id}
                  onChange={() => setPossessionType(type.id)}
                />
                <Radio checked={possessionType === type.id} tone="pos" />
                <span className={cn("text-sm", possessionType === type.id ? "font-semibold text-ink" : "text-ink2")}>
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSearch}
            className="flex h-12 flex-[1_1_220px] items-center justify-center gap-2 rounded-pill bg-brand text-[14.5px] font-bold text-on-brand transition-opacity hover:opacity-90"
          >
            <Search className="h-4 w-4" />
            Search Auctions
          </button>
          <button
            onClick={handleReset}
            className="flex h-12 flex-[0_1_180px] items-center justify-center gap-2 rounded-pill border border-line bg-paper text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  )
}
