"use client"

import { useEffect, useState, useTransition } from "react"
import { Th, Td, Pill, RaBtn, TcHead, TcActionSelect, StatCard, Flbl, Finp, Fsel } from "./ui"
import {
  searchSalesEnquiriesAction,
  updateSalesEnquiry,
  grantSubscription,
  grantServicePackage,
  grantCredits,
} from "@/app/actions/admin-sales"
import type { AdminSalesEnquiryRow, SalesEnquiryStatus } from "@/lib/data/admin"
import { useToast } from "@/hooks/use-toast"

const STATUS_PILL: Record<SalesEnquiryStatus, { label: string; pill: "red" | "gold" | "green" | "gray" }> = {
  new: { label: "New", pill: "red" },
  contacted: { label: "Contacted", pill: "gold" },
  converted: { label: "Converted", pill: "green" },
  closed: { label: "Closed", pill: "gray" },
}

const PLAN_LABEL = {
  annual_subscription: "Annual Membership",
  service_package: "Full Service",
} as const

type GrantKind = "subscription" | "package" | "credits"

/**
 * The sales pipeline, and the only way an entitlement is granted before
 * Razorpay exists.
 *
 * Search and filtering mirror `CallbacksPanel` deliberately — the two sit next
 * to each other in the sidebar and a difference in behaviour would only be a
 * surprise. What is new here is the grant drawer: an admin picks what was paid
 * for, confirms the account email, and the action writes the real entitlement.
 */
export function SalesEnquiriesPanel({ initialRows }: { initialRows: AdminSalesEnquiryRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [status, setStatus] = useState("")
  const [q, setQ] = useState("")
  const [, startTransition] = useTransition()
  const { toast } = useToast()

  // The enquiry whose grant drawer is open, plus what is being granted.
  const [granting, setGranting] = useState<AdminSalesEnquiryRow | null>(null)
  const [grantKind, setGrantKind] = useState<GrantKind>("subscription")
  const [grantEmail, setGrantEmail] = useState("")
  const [grantCreditCount, setGrantCreditCount] = useState("5")
  const [busy, setBusy] = useState(false)

  const [notesFor, setNotesFor] = useState<AdminSalesEnquiryRow | null>(null)
  const [noteDraft, setNoteDraft] = useState("")

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await searchSalesEnquiriesAction({ status: (status || undefined) as never, q: q || undefined })
        setRows(result)
      })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q])

  const setRowStatus = async (id: string, newStatus: SalesEnquiryStatus) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))
    try {
      await updateSalesEnquiry(id, { status: newStatus })
    } catch {
      toast({ variant: "destructive", title: "Couldn't update status" })
    }
  }

  const openGrant = (row: AdminSalesEnquiryRow) => {
    setGranting(row)
    setGrantKind(row.plan === "service_package" ? "package" : "subscription")
    setGrantEmail(row.email ?? "")
    setGrantCreditCount("5")
  }

  const submitGrant = async () => {
    if (!granting) return
    setBusy(true)
    const result =
      grantKind === "subscription"
        ? await grantSubscription(granting.id, grantEmail)
        : grantKind === "package"
          ? await grantServicePackage(granting.id, grantEmail)
          : await grantCredits(granting.id, grantEmail, Number(grantCreditCount))
    setBusy(false)

    if (!result.ok) {
      toast({ variant: "destructive", title: "Nothing was granted", description: result.error })
      return
    }

    toast({ title: "Granted", description: result.message })
    if (grantKind !== "credits") {
      setRows((prev) => prev.map((r) => (r.id === granting.id ? { ...r, status: "converted" } : r)))
    }
    setGranting(null)
  }

  const saveNote = async () => {
    if (!notesFor) return
    const id = notesFor.id
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, notes: noteDraft } : r)))
    setNotesFor(null)
    try {
      await updateSalesEnquiry(id, { notes: noteDraft })
    } catch {
      toast({ variant: "destructive", title: "Couldn't save the note" })
    }
  }

  const count = (s: SalesEnquiryStatus) => rows.filter((r) => r.status === s).length

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💬" iconBg="bg-blue-100 dark:bg-blue-500/20" value={rows.length} label="Total (shown)" />
        <StatCard icon="🆕" iconBg="bg-red-100 dark:bg-red-500/20" value={count("new")} label="New" />
        <StatCard icon="🕐" iconBg="bg-amber-100 dark:bg-amber-500/20" value={count("contacted")} label="Contacted" />
        <StatCard icon="✅" iconBg="bg-emerald-100 dark:bg-emerald-500/20" value={count("converted")} label="Converted" />
      </div>

      {granting && (
        <div className="bg-card border-2 border-primary rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <div className="font-display text-[15px] font-bold text-foreground">
              Grant entitlement — {granting.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Enquired about {PLAN_LABEL[granting.plan]} · {granting.phone}
              {granting.email ? ` · ${granting.email}` : ""}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Flbl>What was paid for</Flbl>
              <Fsel
                value={grantKind}
                onChange={(v) => setGrantKind(v as GrantKind)}
                options={[
                  { label: "Annual membership", value: "subscription" },
                  { label: "Full Service package", value: "package" },
                  { label: "Credits only", value: "credits" },
                ]}
              />
            </div>
            <div className={grantKind === "credits" ? "" : "md:col-span-2"}>
              <Flbl>Account email</Flbl>
              <Finp value={grantEmail} onChange={setGrantEmail} placeholder="the email they signed up with" />
            </div>
            {grantKind === "credits" && (
              <div>
                <Flbl>Credits</Flbl>
                <Finp type="number" value={grantCreditCount} onChange={setGrantCreditCount} />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The account must already exist — the grant is refused if no profile matches that email. Price comes from
            Settings, not from anything typed here.
          </p>
          <div className="flex gap-2 justify-end">
            <RaBtn onClick={() => setGranting(null)}>Cancel</RaBtn>
            <RaBtn primary onClick={submitGrant} disabled={busy || !grantEmail.trim()}>
              {busy ? "Granting…" : "Grant"}
            </RaBtn>
          </div>
        </div>
      )}

      {notesFor && (
        <div className="bg-card border-2 border-border rounded-xl shadow-sm p-5 space-y-3">
          <Flbl>Notes — {notesFor.name}</Flbl>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="What was agreed, what to follow up on…"
            className="w-full min-h-[72px] p-3 border-2 border-border rounded-lg text-[13px] bg-background text-foreground outline-none focus:border-primary"
          />
          <div className="flex gap-2 justify-end">
            <RaBtn onClick={() => setNotesFor(null)}>Cancel</RaBtn>
            <RaBtn primary onClick={saveNote}>Save note</RaBtn>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <TcHead
          title="💬 Sales Enquiries"
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
                  { label: "Converted", value: "converted" },
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
                <Th>Client</Th>
                <Th>Plan</Th>
                <Th>Message / Notes</Th>
                <Th>Enquired</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-[13px] leading-relaxed">
                    No sales enquiries yet. The Contact Sales buttons on Pricing and Services write here.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border ${row.status === "new" ? "bg-red-50/50 dark:bg-red-500/5" : "hover:bg-muted/30"}`}
                  >
                    <Td>
                      <div className="font-bold text-foreground">{row.name}</div>
                      <div className="text-[11px]">📞 {row.phone}{row.email ? ` · ${row.email}` : ""}</div>
                    </Td>
                    <Td>
                      <Pill type={row.plan === "service_package" ? "gold" : "blue"}>{PLAN_LABEL[row.plan]}</Pill>
                    </Td>
                    <Td>
                      {row.message && <div className="text-[13px]">{row.message}</div>}
                      {row.notes && <div className="text-[11px] italic mt-1">📝 {row.notes}</div>}
                      {!row.message && !row.notes && "—"}
                    </Td>
                    <Td>{new Date(row.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</Td>
                    <Td>
                      <Pill type={STATUS_PILL[row.status].pill}>{STATUS_PILL[row.status].label}</Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-1.5 flex-wrap">
                        {row.status === "new" && (
                          <RaBtn onClick={() => setRowStatus(row.id, "contacted")}>Mark Contacted</RaBtn>
                        )}
                        {row.status !== "converted" && (
                          <RaBtn primary onClick={() => openGrant(row)}>Grant…</RaBtn>
                        )}
                        <RaBtn
                          onClick={() => {
                            setNotesFor(row)
                            setNoteDraft(row.notes ?? "")
                          }}
                        >
                          Notes
                        </RaBtn>
                        {row.status !== "closed" && row.status !== "converted" && (
                          <RaBtn onClick={() => setRowStatus(row.id, "closed")}>Close</RaBtn>
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
