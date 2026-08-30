"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { MapPin, LayoutGrid, List, Bookmark, Building2, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleShortlist } from "@/app/actions/shortlist"
import { useToast } from "@/hooks/use-toast"
import { currentPath, withNext } from "@/lib/auth/next-param"
import { formatDateShort, formatINR, reservePricePerSqft } from "@/lib/format"
import type { SearchListing } from "@/lib/data/listings"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  agricultural: "Agricultural",
  mixed_use: "Mixed Use",
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
      <div className="flex justify-end mb-4">
        <div className="flex bg-background border border-border rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-orange-400 text-white" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`w-9 h-9 flex items-center justify-center transition-colors border-l border-border ${viewMode === "list" ? "bg-orange-400 text-white" : "text-muted-foreground hover:bg-secondary"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {listings.map((p) => (
          <Link
            href={`/listing/${p.slug}`}
            key={p.id}
            className="bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
          >
            <div className="h-44 bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center relative shrink-0">
              <Building2 className="w-16 h-16 text-muted-foreground/30 group-hover:text-orange-400/30 transition-colors" />
              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide">
                {p.bank.shortName}
              </div>
              <div className="absolute top-3 right-3 bg-white/95 text-foreground text-[10px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
                {PROPERTY_TYPE_LABELS[p.propertyType]}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                📅 {formatDateShort(p.auctionDate)}
              </div>
              <div
                className={`absolute bottom-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm ${p.possessionType === "physical" ? "bg-emerald-100/90 text-emerald-800" : "bg-purple-100/90 text-purple-800"}`}
              >
                {p.possessionType === "physical" ? "🔑 Physical" : "📝 Symbolic"}
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Reserve Price</div>
              <div className={`text-xl font-bold text-foreground tracking-tight ${reservePricePerSqft(p.reservePrice, p.areaSqft) ? "" : "mb-2"}`}>
                {formatINR(p.reservePrice)}
              </div>
              {reservePricePerSqft(p.reservePrice, p.areaSqft) && (
                <div className="text-[11px] font-medium text-muted-foreground mb-2">{reservePricePerSqft(p.reservePrice, p.areaSqft)}</div>
              )}
              <div className="text-sm font-semibold text-foreground leading-snug mb-1">{p.title}</div>
              <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> {p.locality}, {p.city}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                {p.areaSqft && (
                  <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-border flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" /> ~{p.areaSqft} sq.ft
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded border border-border">
                  <Eye className="w-3 h-3 inline mr-1" /> {p.viewCount}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 border-t border-border bg-secondary/20 mt-auto">
              <div className="text-xs text-muted-foreground">
                EMD: <strong className="text-red-500 font-semibold">{formatINR(p.emdAmount)}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => toggleSave(p.id, e)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors border ${saved.has(p.id) ? "bg-orange-400/10 text-orange-400 border-orange-400/30" : "bg-background text-muted-foreground border-border hover:border-orange-400/50 hover:text-orange-400"}`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved.has(p.id) ? "fill-current" : ""}`} />
                  {saved.has(p.id) ? "Saved" : "Save"}
                </button>
                <div className="px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
