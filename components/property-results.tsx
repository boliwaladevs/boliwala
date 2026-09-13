import Link from "next/link"
import { Home, X, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getLendersWithCounts, parseSearchFilters, searchListings, PAGE_SIZE, LENDER_TYPES, LENDER_TYPE_LABELS, type SearchParamsInput } from "@/lib/data/listings"
import { buildSearchHref, filterHref, toggleArrayValue } from "@/lib/search-url"
import { formatINR } from "@/lib/format"
import { SearchSortSelect } from "@/components/search-sort-select"
import { PropertyGrid } from "@/components/property-grid"
import { SearchAlertBanner } from "@/components/search-alert-banner"

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

const GROUP_LABEL = "mb-3 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink2"
const ROW = "flex items-start gap-2.5 py-1.5 group"
const ROW_TEXT = "text-sm leading-[1.35] transition-colors"

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? "mt-0.5 h-4 w-4 shrink-0 rounded-full border-[5px] border-brand shadow-[inset_0_0_0_2px_var(--paper)]"
          : "mt-0.5 h-4 w-4 shrink-0 rounded-full border-[1.5px] border-line transition-colors group-hover:border-brand/50"
      }
    />
  )
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={
        checked
          ? "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border border-brand bg-brand text-on-brand"
          : "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border border-line transition-colors group-hover:border-brand/50"
      }
    >
      {checked && (
        <svg viewBox="0 0 14 14" fill="none" className="h-3 w-3">
          <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export async function PropertyResults({ searchParams }: { searchParams: SearchParamsInput }) {
  const filters = parseSearchFilters(searchParams)
  const base = "/search"

  const [{ listings, totalCount }, lenders] = await Promise.all([
    searchListings(filters),
    getLendersWithCounts(filters),
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
  const lenderById = new Map(lenders.map((b) => [b.id, b]))

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
  for (const lenderType of filters.lenderTypes) {
    activeChips.push({
      label: LENDER_TYPE_LABELS[lenderType],
      href: filterHref(base, searchParams, { lenderType: toggleArrayValue(searchParams, "lenderType", lenderType) }),
    })
  }
  for (const lenderId of filters.lenderIds) {
    activeChips.push({
      label: lenderById.get(lenderId)?.shortName ?? "Lender",
      href: filterHref(base, searchParams, { lender: toggleArrayValue(searchParams, "lender", lenderId) }),
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
    <div className="mx-auto max-w-[1240px] px-5 py-8">
      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink2">Active filters:</span>
          {activeChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center gap-1.5 rounded-pill bg-brand-soft px-3.5 py-1.5 text-[13px] font-semibold text-brand transition-opacity hover:opacity-80"
            >
              {chip.label} <X className="h-3 w-3 opacity-55" />
            </Link>
          ))}
          <Link href={base} className="ml-2 text-[13px] font-semibold text-ink2 transition-colors hover:text-ink">
            Clear all
          </Link>
        </div>
      )}

      <SearchAlertBanner
        queryString={new URLSearchParams(
          Object.entries(searchParams).flatMap(([k, v]) =>
            v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x] as [string, string]) : [[k, v] as [string, string]],
          ),
        ).toString()}
        summary={summaryParts}
        defaultEmail={user?.email ?? undefined}
      />

      <div className="flex flex-wrap items-start gap-6">
        {/* Sidebar */}
        <aside className="h-fit w-full min-w-[250px] max-w-full flex-[1_1_250px] overflow-hidden rounded-card border border-line bg-paper lg:sticky lg:top-6 lg:max-w-[290px]">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="text-[14.5px] font-bold text-ink">Refine filters</h3>
            <Link href={base} className="text-[13px] font-semibold text-ink2 transition-colors hover:text-ink">
              Clear all
            </Link>
          </div>

          <div className="border-b border-line px-5 py-4">
            <h4 className={GROUP_LABEL}>Property Type</h4>
            <Link href={filterHref(base, searchParams, { propertyType: null })} className={ROW}>
              <RadioDot checked={!filters.propertyType} />
              <span className={`${ROW_TEXT} ${!filters.propertyType ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>All Types</span>
            </Link>
            {PROPERTY_TYPES.map((pt) => (
              <Link key={pt.value} href={filterHref(base, searchParams, { propertyType: pt.value })} className={ROW}>
                <RadioDot checked={filters.propertyType === pt.value} />
                <span className={`${ROW_TEXT} ${filters.propertyType === pt.value ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>{pt.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-b border-line px-5 py-4">
            <h4 className={GROUP_LABEL}>Lender Type</h4>
            {LENDER_TYPES.map((type) => {
              const checked = filters.lenderTypes.includes(type)
              return (
                <Link
                  key={type}
                  href={filterHref(base, searchParams, { lenderType: toggleArrayValue(searchParams, "lenderType", type) })}
                  className={ROW}
                >
                  <CheckBox checked={checked} />
                  <span className={`${ROW_TEXT} ${checked ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>{LENDER_TYPE_LABELS[type]}</span>
                </Link>
              )
            })}
          </div>

          <div className="border-b border-line px-5 py-4">
            <h4 className={GROUP_LABEL}>Lender</h4>
            {lenders.map((lender) => {
              const checked = filters.lenderIds.includes(lender.id)
              return (
                <Link
                  key={lender.id}
                  href={filterHref(base, searchParams, { lender: toggleArrayValue(searchParams, "lender", lender.id) })}
                  className={`${ROW} justify-between`}
                >
                  <span className="flex items-start gap-2.5">
                    <CheckBox checked={checked} />
                    <span className={`${ROW_TEXT} ${checked ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>{lender.name}</span>
                  </span>
                  <span className="shrink-0 pl-2 text-[13px] tabular-nums text-ink2">{lender.count}</span>
                </Link>
              )
            })}
          </div>

          <div className="border-b border-line px-5 py-4">
            <h4 className={GROUP_LABEL}>Possession</h4>
            <Link href={filterHref(base, searchParams, { possession: null })} className={ROW}>
              <RadioDot checked={!filters.possession} />
              <span className={`${ROW_TEXT} ${!filters.possession ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>All</span>
            </Link>
            {POSSESSION_TYPES.map((pt) => (
              <Link key={pt.value} href={filterHref(base, searchParams, { possession: pt.value })} className={ROW}>
                <RadioDot checked={filters.possession === pt.value} />
                <span className={`${ROW_TEXT} ${filters.possession === pt.value ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>{pt.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-b border-line px-5 py-4">
            <h4 className={GROUP_LABEL}>Auction Date</h4>
            <Link href={filterHref(base, searchParams, { auctionWindow: null })} className={ROW}>
              <RadioDot checked={!filters.auctionWindow} />
              <span className={`${ROW_TEXT} ${!filters.auctionWindow ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>Any Time</span>
            </Link>
            {AUCTION_WINDOWS.map((w) => (
              <Link key={w.value} href={filterHref(base, searchParams, { auctionWindow: w.value })} className={ROW}>
                <RadioDot checked={filters.auctionWindow === w.value} />
                <span className={`${ROW_TEXT} ${filters.auctionWindow === w.value ? "font-semibold text-ink" : "text-ink2 group-hover:text-ink"}`}>{w.label}</span>
              </Link>
            ))}
          </div>

          <div className="px-5 py-4">
            <h4 className={GROUP_LABEL}>Price Range (₹)</h4>
            <form action={base} method="get">
              {Object.entries(searchParams).flatMap(([key, value]) => {
                if (key === "minPrice" || key === "maxPrice" || key === "page") return []
                const values = Array.isArray(value) ? value : [value]
                return values.filter(Boolean).map((v, i) => <input key={`${key}-${i}`} type="hidden" name={key} value={v} />)
              })}
              <div className="mb-3 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  name="minPrice"
                  defaultValue={filters.minPrice ?? ""}
                  placeholder="Min"
                  aria-label="Minimum price"
                  className="h-10 rounded-field border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none transition-colors placeholder:text-ink2/70 focus:border-brand"
                />
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={filters.maxPrice ?? ""}
                  placeholder="Max"
                  aria-label="Maximum price"
                  className="h-10 rounded-field border border-line bg-surface px-3 text-sm tabular-nums text-ink outline-none transition-colors placeholder:text-ink2/70 focus:border-brand"
                />
              </div>
              <button
                type="submit"
                className="h-10 w-full rounded-pill bg-ink text-sm font-semibold text-paper transition-opacity hover:opacity-90"
              >
                Apply
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-[999_1_380px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-ink2">
              <strong className="font-bold text-ink">{totalCount}</strong> {totalCount === 1 ? "property" : "properties"}
              {summaryParts.length > 0 && <> · {summaryParts.join(" · ")}</>}
            </div>
            <SearchSortSelect currentSort={filters.sort} />
          </div>

          {listings.length === 0 ? (
            <div className="rounded-card border border-line bg-paper py-16 text-center text-ink2">
              <Home className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No properties match these filters. Try widening your search.
            </div>
          ) : (
            <PropertyGrid listings={listings} shortlistedIds={shortlistedIds} isSignedIn={!!user} />
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
              <Link
                href={buildSearchHref(base, searchParams, { page: String(Math.max(1, filters.page - 1)) })}
                aria-label="Previous page"
                className="flex h-9 min-w-9 items-center justify-center rounded-pill border border-line bg-paper px-2 text-ink2 transition-colors hover:bg-surface hover:text-ink"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildSearchHref(base, searchParams, { page: String(p) })}
                  aria-current={p === filters.page ? "page" : undefined}
                  className={
                    p === filters.page
                      ? "flex h-9 min-w-9 items-center justify-center rounded-pill bg-brand px-2 text-sm font-bold tabular-nums text-on-brand"
                      : "flex h-9 min-w-9 items-center justify-center rounded-pill border border-line bg-paper px-2 text-sm font-medium tabular-nums text-ink2 transition-colors hover:bg-surface hover:text-ink"
                  }
                >
                  {p}
                </Link>
              ))}
              <Link
                href={buildSearchHref(base, searchParams, { page: String(Math.min(totalPages, filters.page + 1)) })}
                aria-label="Next page"
                className="flex h-9 min-w-9 items-center justify-center rounded-pill border border-line bg-paper px-2 text-ink2 transition-colors hover:bg-surface hover:text-ink"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
