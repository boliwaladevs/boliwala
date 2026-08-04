import Link from "next/link"
import { Bell, MapPin, Home, X, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getBanksWithCounts, parseSearchFilters, searchListings, PAGE_SIZE, type SearchParamsInput } from "@/lib/data/listings"
import { buildSearchHref, filterHref, toggleArrayValue } from "@/lib/search-url"
import { formatINR } from "@/lib/format"
import { SearchSortSelect } from "@/components/search-sort-select"
import { PropertyGrid } from "@/components/property-grid"

const PROPERTY_TYPES: { value: string; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "mixed_use", label: "Mixed Use" },
]

const POSSESSION_TYPES: { value: string; label: string }[] = [
  { value: "physical", label: "Physical" },
  { value: "symbolic", label: "Symbolic" },
]

const AUCTION_WINDOWS: { value: string; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
]

export async function PropertyResults({ searchParams }: { searchParams: SearchParamsInput }) {
  const filters = parseSearchFilters(searchParams)
  const base = "/search"

  const [{ listings, totalCount }, banks] = await Promise.all([
    searchListings(filters),
    getBanksWithCounts(filters),
  ])

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let shortlistedIds: string[] = []
  if (user && listings.length > 0) {
    const { data } = await supabase
      .from("shortlists")
      .select("listingId")
      .eq("userId", user.id)
      .in(
        "listingId",
        listings.map((l) => l.id),
      )
    shortlistedIds = (data ?? []).map((r) => r.listingId)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const bankById = new Map(banks.map((b) => [b.id, b]))

  const activeChips: { label: string; href: string }[] = []
  if (filters.location) activeChips.push({ label: filters.location, href: filterHref(base, searchParams, { location: null }) })
  if (filters.q) activeChips.push({ label: filters.q, href: filterHref(base, searchParams, { q: null }) })
  if (filters.propertyType) {
    activeChips.push({
      label: PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.label ?? filters.propertyType,
      href: filterHref(base, searchParams, { propertyType: null }),
    })
  }
  if (filters.possession) {
    activeChips.push({
      label: POSSESSION_TYPES.find((t) => t.value === filters.possession)?.label ?? filters.possession,
      href: filterHref(base, searchParams, { possession: null }),
    })
  }
  for (const bankId of filters.bankIds) {
    activeChips.push({
      label: bankById.get(bankId)?.shortName ?? "Bank",
      href: filterHref(base, searchParams, { bank: toggleArrayValue(searchParams, "bank", bankId) }),
    })
  }
  if (filters.minPrice || filters.maxPrice) {
    activeChips.push({
      label: `${filters.minPrice ? formatINR(filters.minPrice) : "₹0"} – ${filters.maxPrice ? formatINR(filters.maxPrice) : "Any"}`,
      href: filterHref(base, searchParams, { minPrice: null, maxPrice: null }),
    })
  }
  if (filters.auctionWindow) {
    activeChips.push({
      label: AUCTION_WINDOWS.find((w) => w.value === filters.auctionWindow)?.label ?? filters.auctionWindow,
      href: filterHref(base, searchParams, { auctionWindow: null }),
    })
  }

  const summaryParts = activeChips.map((c) => c.label)

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Active filters:</span>
          {activeChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center gap-1.5 bg-background border border-orange-400/50 rounded-full px-3 py-1 text-xs font-semibold text-orange-400 hover:bg-orange-400/10 transition-colors"
            >
              <MapPin className="w-3 h-3" /> {chip.label} <X className="w-3 h-3 opacity-70 hover:opacity-100" />
            </Link>
          ))}
          <Link href={base} className="text-xs font-semibold text-red-400 hover:text-red-500 ml-2">
            Clear all
          </Link>
        </div>
      )}

      {/* Alert Banner */}
      <div className="bg-background border border-border rounded-xl shadow-sm p-5 md:p-6 mb-8 flex flex-col lg:flex-row items-start lg:items-center gap-5">
        <div className="w-12 h-12 rounded-lg bg-orange-400/10 flex items-center justify-center shrink-0">
          <Bell className="w-6 h-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground mb-1">Get email alerts for this search</h3>
          <p className="text-sm text-muted-foreground">
            {summaryParts.length > 0
              ? `New properties matching ${summaryParts.join(" · ")} will be emailed to you automatically.`
              : "New properties matching this search will be emailed to you automatically."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          <input
            type="email"
            placeholder="your@email.com"
            className="h-10 px-4 border border-border rounded-md text-sm bg-background w-full sm:w-[220px] focus:outline-none focus:border-orange-400/50 placeholder:text-muted-foreground/60"
          />
          <select className="h-10 px-3 border border-border rounded-md text-sm bg-background w-full sm:w-[130px] focus:outline-none focus:border-orange-400/50 appearance-none text-foreground/90">
            <option>Instant</option>
            <option>Daily digest</option>
            <option>Weekly</option>
          </select>
          <button className="h-10 px-5 bg-orange-400 hover:bg-orange-500 text-white border-none rounded-md text-sm font-semibold whitespace-nowrap w-full sm:w-auto transition-colors shadow-sm">
            Set Alert
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block bg-background border border-border rounded-xl shadow-sm overflow-hidden h-fit sticky top-24">
          <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Refine Filters
            </h3>
            <Link href={base} className="text-xs font-semibold text-red-400 hover:text-red-500">
              Clear all
            </Link>
          </div>

          <div className="p-4 border-b border-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Property Type</h4>
            <div className="space-y-2.5">
              <Link
                href={filterHref(base, searchParams, { propertyType: null })}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!filters.propertyType ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                  {!filters.propertyType && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                </div>
                <span className={`text-sm transition-colors ${!filters.propertyType ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>All Types</span>
              </Link>
              {PROPERTY_TYPES.map((pt) => (
                <Link
                  key={pt.value}
                  href={filterHref(base, searchParams, { propertyType: pt.value })}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.propertyType === pt.value ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                    {filters.propertyType === pt.value && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                  </div>
                  <span className={`text-sm transition-colors ${filters.propertyType === pt.value ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{pt.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Bank</h4>
            <div className="space-y-2.5">
              {banks.map((bank) => {
                const checked = filters.bankIds.includes(bank.id)
                return (
                  <Link
                    key={bank.id}
                    href={filterHref(base, searchParams, { bank: toggleArrayValue(searchParams, "bank", bank.id) })}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${checked ? "bg-orange-400 border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                        {checked && (
                          <svg viewBox="0 0 14 14" fill="none" className="w-3 h-3 text-white">
                            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{bank.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded-full">{bank.count}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Price Range (₹)</h4>
            <form action={base} method="get" className="contents">
              {Object.entries(searchParams).flatMap(([key, value]) => {
                if (key === "minPrice" || key === "maxPrice" || key === "page") return []
                const values = Array.isArray(value) ? value : [value]
                return values.filter(Boolean).map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />)
              })}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={filters.minPrice ?? ""}
                  placeholder="Min"
                  className="h-9 px-3 border border-border rounded-md text-sm bg-background focus:border-orange-400/50 focus:outline-none placeholder:text-muted-foreground/60 text-foreground/90"
                />
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={filters.maxPrice ?? ""}
                  placeholder="Max"
                  className="h-9 px-3 border border-border rounded-md text-sm bg-background focus:border-orange-400/50 focus:outline-none placeholder:text-muted-foreground/60 text-foreground/90"
                />
              </div>
              <button type="submit" className="w-full bg-foreground text-background font-medium h-9 rounded-md text-sm hover:bg-foreground/90 transition-colors">
                Apply
              </button>
            </form>
          </div>

          <div className="p-4 border-b border-border">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Possession</h4>
            <div className="space-y-2.5">
              <Link href={filterHref(base, searchParams, { possession: null })} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!filters.possession ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                  {!filters.possession && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                </div>
                <span className={`text-sm transition-colors ${!filters.possession ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>All</span>
              </Link>
              {POSSESSION_TYPES.map((pt) => (
                <Link key={pt.value} href={filterHref(base, searchParams, { possession: pt.value })} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.possession === pt.value ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                    {filters.possession === pt.value && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                  </div>
                  <span className={`text-sm transition-colors ${filters.possession === pt.value ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{pt.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Auction Date</h4>
            <div className="space-y-2.5">
              <Link href={filterHref(base, searchParams, { auctionWindow: null })} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${!filters.auctionWindow ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                  {!filters.auctionWindow && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                </div>
                <span className={`text-sm transition-colors ${!filters.auctionWindow ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>Any Time</span>
              </Link>
              {AUCTION_WINDOWS.map((w) => (
                <Link key={w.value} href={filterHref(base, searchParams, { auctionWindow: w.value })} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${filters.auctionWindow === w.value ? "border-orange-400" : "border-muted-foreground/50 group-hover:border-foreground/50"}`}>
                    {filters.auctionWindow === w.value && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                  </div>
                  <span className={`text-sm transition-colors ${filters.auctionWindow === w.value ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{w.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div>
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground font-bold">{totalCount}</strong> {totalCount === 1 ? "property" : "properties"}
              {summaryParts.length > 0 && <> · {summaryParts.join(" · ")}</>}
            </div>
            <SearchSortSelect currentSort={filters.sort} />
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Home className="w-10 h-10 mx-auto mb-3 opacity-40" />
              No properties match these filters. Try widening your search.
            </div>
          ) : (
            <PropertyGrid listings={listings} shortlistedIds={shortlistedIds} isSignedIn={!!user} />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <Link
                href={buildSearchHref(base, searchParams, { page: String(Math.max(1, filters.page - 1)) })}
                className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:border-orange-400 hover:text-orange-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildSearchHref(base, searchParams, { page: String(p) })}
                  className={
                    p === filters.page
                      ? "w-9 h-9 rounded-md border border-orange-400 bg-orange-400 flex items-center justify-center text-white font-bold shadow-sm"
                      : "w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground font-medium hover:border-orange-400 hover:text-orange-400 transition-colors"
                  }
                >
                  {p}
                </Link>
              ))}
              <Link
                href={buildSearchHref(base, searchParams, { page: String(Math.min(totalPages, filters.page + 1)) })}
                className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:border-orange-400 hover:text-orange-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
