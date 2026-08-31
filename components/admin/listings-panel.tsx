"use client"

import { useEffect, useState, useTransition } from "react"
import { Th, Td, Pill, RaBtn, TcHead, TcActionSelect, TcActionBtn } from "./ui"
import { searchAdminListingsAction, cancelListing } from "@/app/actions/admin-listings"
import type { AdminListingRow } from "@/lib/data/admin"
import { formatDateShort, formatINR } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"

const STATUS_LABELS: Record<string, { label: string; pill: "green" | "gold" | "gray" | "red" }> = {
  draft: { label: "Draft", pill: "gray" },
  live: { label: "Active", pill: "green" },
  closed: { label: "Closed", pill: "gold" },
  cancelled: { label: "Cancelled", pill: "red" },
}

export function ListingsPanel({
  initialListings,
  lenders,
  onAddListing,
  onEditListing,
  onBulkUpload,
}: {
  initialListings: AdminListingRow[]
  lenders: { id: string; name: string }[]
  onAddListing: () => void
  onEditListing: (id: string) => void
  onBulkUpload: () => void
}) {
  const [listings, setListings] = useState(initialListings)
  const [q, setQ] = useState("")
  const [lenderId, setBankId] = useState("")
  const [status, setStatus] = useState("")
  const [, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchAdminListingsAction({
          q: q || undefined,
          lenderId: lenderId || undefined,
          status: (status || undefined) as never,
        })
        setListings(result)
      })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, lenderId, status])

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this listing? It will stop showing on the public site.")) return
    const result = await cancelListing(id).catch(() => null)
    if (!result) {
      toast({ variant: "destructive", title: "Couldn't cancel listing" })
      return
    }
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: "cancelled" } : l)))
    toast({ title: "Listing cancelled" })
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead
          title={
            <>
              🏠 All Listings <span className="text-xs font-normal text-muted-foreground">{listings.length} shown</span>
            </>
          }
          acts={
            <>
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, city, slug…"
                className="h-8 px-3 border-2 border-border rounded-lg text-[13px] outline-none focus:border-primary bg-background w-[180px]"
              />
              <TcActionSelect
                value={lenderId}
                onChange={setBankId}
                options={[{ label: "All Lenders", value: "" }, ...lenders.map((b) => ({ label: b.name, value: b.id }))]}
              />
              <TcActionSelect
                value={status}
                onChange={setStatus}
                options={[
                  { label: "All Status", value: "" },
                  { label: "Draft", value: "draft" },
                  { label: "Active", value: "live" },
                  { label: "Closed", value: "closed" },
                  { label: "Cancelled", value: "cancelled" },
                ]}
              />
              <TcActionBtn onClick={onBulkUpload}>📂 Bulk Upload</TcActionBtn>
              <TcActionBtn primary onClick={onAddListing}>
                ➕ Add Listing
              </TcActionBtn>
            </>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <Th>Property</Th>
                <Th>Lender</Th>
                <Th>Reserve Price</Th>
                <Th>EMD</Th>
                <Th>Auction Date</Th>
                <Th>Views</Th>
                <Th>PDF</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground text-sm">
                    No listings match these filters.
                  </td>
                </tr>
              ) : (
                listings.map((row) => (
                  <tr key={row.id} className="border-b border-border hover:bg-muted/30">
                    <Td>
                      <div className="font-semibold text-foreground">{row.title}</div>
                      <div className="text-[11px]">{row.city}</div>
                    </Td>
                    <Td>{row.lender.shortName}</Td>
                    <Td className="font-semibold text-foreground">{formatINR(row.reservePrice)}</Td>
                    <Td>{formatINR(row.emdAmount)}</Td>
                    <Td>{formatDateShort(row.auctionDate)}</Td>
                    <Td>
                      <span className="text-[12px] bg-secondary px-2 py-0.5 rounded-full">👁 {row.viewCount}</span>
                    </Td>
                    <Td>
                      <span className={row.noticeUrl ? "text-emerald-500" : "text-red-500"}>{row.noticeUrl ? "✅" : "❌"}</span>
                    </Td>
                    <Td>
                      <Pill type={STATUS_LABELS[row.status].pill}>• {STATUS_LABELS[row.status].label}</Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <RaBtn onClick={() => onEditListing(row.id)}>Edit</RaBtn>
                        {row.status !== "cancelled" && (
                          <RaBtn danger onClick={() => handleCancel(row.id)}>
                            ✕
                          </RaBtn>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
