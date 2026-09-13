"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { LayoutGrid, List, Bookmark, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleShortlist } from "@/app/actions/shortlist"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { currentPath, withNext } from "@/lib/auth/next-param"
import { formatDateShort, formatINR, reservePricePerSqft } from "@/lib/format"
import { PhotoSlot } from "@/components/photo-slot"
import type { SearchListing } from "@/lib/data/listings"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  agricultural: "Agricultural",
  mixed_use: "Mixed Use",
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function PropertyGrid({
  listings,
  shortlistedIds,
  isSignedIn,
}: {
  listings: SearchListing[]
  shortlistedIds: string[]
  isSignedIn: boolean
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [saved, setSaved] = useState<Set<string>>(new Set(shortlistedIds))
  const [, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const toggleSave = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isSignedIn) {
      toast({ title: "Sign in to save properties", description: "Create a free account to build your shortlist." })
      router.push(withNext("/login", currentPath()))
      return
    }

    const wasSaved = saved.has(listingId)
    setSaved((prev) => {
      const next = new Set(prev)
      wasSaved ? next.delete(listingId) : next.add(listingId)
      return next
    })

    startTransition(async () => {
      const result = await toggleShortlist(listingId)
      if ("error" in result) {
        setSaved((prev) => {
          const next = new Set(prev)
          wasSaved ? next.add(listingId) : next.delete(listingId)
          return next
        })
        toast({ variant: "destructive", title: "Couldn't update shortlist" })
      }
    })
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div className="flex gap-1 rounded-pill border border-line bg-paper p-1">
          <button
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-pill transition-colors",
              viewMode === "grid" ? "bg-brand text-on-brand" : "text-ink2 hover:bg-surface",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-pill transition-colors",
              viewMode === "list" ? "bg-brand text-on-brand" : "text-ink2 hover:bg-surface",
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-[18px]",
          viewMode === "grid" ? "[grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]" : "grid-cols-1",
        )}
      >
        {listings.map((p) => {
          const perSqft = reservePricePerSqft(p.reservePrice, p.areaSqft)
          const left = daysUntil(p.auctionDate)
          const isSaved = saved.has(p.id)

          return (
            <article
              key={p.id}
              className="relative flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card transition-shadow hover:shadow-panel"
            >
              <PhotoSlot label="Property photo" ratio="16 / 10">
                <span className="absolute left-3 top-3 rounded-pill bg-[rgba(24,20,16,0.78)] px-[11px] py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-white backdrop-blur-[6px]">
                  {p.lender.shortName}
                </span>
                <span className="absolute right-3 top-3 rounded-pill bg-[rgba(255,255,255,0.94)] px-[11px] py-[5px] text-[10.5px] font-bold text-[#22201D]">
                  {PROPERTY_TYPE_LABELS[p.propertyType]}
                </span>
                <span
                  className={cn(
                    "absolute bottom-3 left-3 rounded-pill px-[11px] py-[5px] text-[10.5px] font-bold",
                    p.possessionType === "physical"
                      ? "bg-[rgba(47,107,79,0.9)] text-white"
                      : "bg-[rgba(255,255,255,0.92)] text-[#22201D]",
                  )}
                >
                  {p.possessionType === "physical" ? "Physical" : "Symbolic"}
                </span>
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-pill bg-[rgba(255,255,255,0.92)] px-[9px] py-[5px] text-[10.5px] font-bold tabular-nums text-[#22201D]">
                  <Eye className="h-3 w-3" />
                  {p.viewCount}
                </span>
              </PhotoSlot>

              <div className="px-[18px] pb-4 pt-4">
                <div className="font-serif text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
                  {formatINR(p.reservePrice)}
                </div>
                <div className="mb-2.5 text-xs text-ink2">
                  Reserve price
                  {perSqft && <> · {perSqft}</>}
                  {p.areaSqft && <> · {p.areaSqft} sq.ft</>}
                </div>
                <h3 className="mb-[3px] text-[15.5px] font-semibold leading-[1.35] text-ink">
                  <Link href={`/listing/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">
                    {p.title}
                  </Link>
                </h3>
                <div className="text-[13.5px] text-ink2">
                  {p.locality}, {p.city} · {p.state}
                </div>
              </div>

              <div className="mt-auto grid grid-cols-2 border-t border-line">
                <div className="border-r border-line px-[18px] py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">Auction</div>
                  <div className="text-sm font-bold tabular-nums text-ink">{formatDateShort(p.auctionDate)}</div>
                  {left >= 0 && (
                    <div className="text-[11.5px] font-semibold text-brand" suppressHydrationWarning>
                      {left === 0 ? "Today" : `${left} day${left === 1 ? "" : "s"} left`}
                    </div>
                  )}
                </div>
                <div className="px-[18px] py-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">EMD</div>
                  <div className="text-sm font-bold tabular-nums text-ink">{formatINR(p.emdAmount)}</div>
                  <div className="truncate text-[11.5px] text-ink2">{p.lender.shortName}</div>
                </div>
              </div>

              <div className="relative z-[1] flex gap-2 border-t border-line px-[18px] py-3">
                <button
                  onClick={(e) => toggleSave(p.id, e)}
                  className={cn(
                    "flex h-[38px] flex-1 items-center justify-center gap-1.5 rounded-pill border text-[13px] font-semibold transition-colors",
                    isSaved ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink hover:bg-paper",
                  )}
                >
                  <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
                  {isSaved ? "Saved" : "Save"}
                </button>
                <Link
                  href={`/listing/${p.slug}`}
                  className="flex h-[38px] flex-1 items-center justify-center rounded-pill bg-brand text-[13px] font-semibold text-on-brand transition-opacity hover:opacity-90"
                >
                  View
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
