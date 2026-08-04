"use client"

import { useEffect, useState, useTransition } from "react"
import { Th, Td, Pill, RaBtn, TcHead, TcActionSelect, StatCard } from "./ui"
import { searchCallbackRequestsAction, updateCallbackRequest } from "@/app/actions/admin-callbacks"
import type { AdminCallbackRow, CallbackStatus } from "@/lib/data/admin"
import { useToast } from "@/hooks/use-toast"

const STATUS_PILL: Record<CallbackStatus, { label: string; pill: "red" | "gold" | "green" }> = {
  new: { label: "New", pill: "red" },
  contacted: { label: "Contacted", pill: "gold" },
  closed: { label: "Closed", pill: "green" },
}

export function CallbacksPanel({ initialRows }: { initialRows: AdminCallbackRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")
  const [, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchCallbackRequestsAction({ status: (status || undefined) as never, q: q || undefined })
        setRows(result)
      })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q])

  const setRowStatus = async (id: string, newStatus: CallbackStatus) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    try {
      await updateCallbackRequest(id, { status: newStatus })
    } catch {
      toast({ variant: "destructive", title: "Couldn't update status" })
    }
  }

  const newCount = rows.filter((r) => r.status === "new").length
  const contactedCount = rows.filter((r) => r.status === "contacted").length
  const closedCount = rows.filter((r) => r.status === "closed").length

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📞" iconBg="bg-red-100 dark:bg-red-500/20" value={rows.length} label="Total (shown)" />
        <StatCard icon="🆕" iconBg="bg-red-100 dark:bg-red-500/20" value={newCount} label="New" />
        <StatCard icon="🕐" iconBg="bg-amber-100 dark:bg-amber-500/20" value={contactedCount} label="Contacted" />
        <StatCard icon="✅" iconBg="bg-emerald-100 dark:bg-emerald-500/20" value={closedCount} label="Closed" />
      </div>
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead
          title="📞 Callback Requests"
          acts={
            <>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 px-3 border-2 border-border rounded-lg text-[13px] bg-background w-[180px]"
                placeholder="Search name, phone, email…"
              />
              <TcActionSelect
                value={status}
                onChange={setStatus}
                options={[
                  { label: "All Status", value: "" },
                  { label: "New", value: "new" },
                  { label: "Contacted", value: "contacted" },
                  { label: "Closed", value: "closed" },
                ]}
              />
            </>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <Th>User</Th>
                <Th>Property / Message</Th>
                <Th>Source</Th>
                <Th>Requested</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No callback requests yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className={`border-b border-border ${row.status === "new" ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-muted/30"}`}>
                    <Td>
                      <div className="font-bold text-foreground">{row.name}</div>
                      <div className="text-[11px]">📞 {row.phone}{row.email ? ` · ${row.email}` : ""}</div>
                    </Td>
                    <Td>
                      {row.listing ? <div className="font-medium text-foreground">{row.listing.title}</div> : null}
                      {row.message && <div className="text-[13px]">{row.message}</div>}
                      {!row.listing && !row.message && "—"}
                    </Td>
                    <Td className="capitalize">{row.source}</Td>
                    <Td>{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</Td>
                    <Td>
                      <Pill type={STATUS_PILL[row.status].pill}>{STATUS_PILL[row.status].label}</Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5">
                        {row.status !== "contacted" && (
                          <RaBtn primary onClick={() => setRowStatus(row.id, "contacted")}>Mark Contacted</RaBtn>
                        )}
                        {row.status !== "closed" && <RaBtn onClick={() => setRowStatus(row.id, "closed")}>Close</RaBtn>}
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
