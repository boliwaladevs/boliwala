"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { FormSection, AlertStrip, TcActionSelect, Th, Td } from "./ui"
import { bulkCommitListings, type ListingInput } from "@/app/actions/admin-listings"
import { useToast } from "@/hooks/use-toast"

const TARGET_FIELDS: { key: keyof ListingInput; label: string; required: boolean }[] = [
  { key: "title", label: "Title", required: true },
  { key: "bankId", label: "Bank (name)", required: true },
  { key: "city", label: "City", required: true },
  { key: "addressLine", label: "Address Line", required: true },
  { key: "locality", label: "Locality", required: false },
  { key: "state", label: "State", required: false },
  { key: "pincode", label: "Pincode", required: false },
  { key: "reservePrice", label: "Reserve Price", required: true },
  { key: "emdAmount", label: "EMD Amount", required: true },
  { key: "auctionDate", label: "Auction Date", required: true },
  { key: "emdDeadline", label: "EMD Deadline", required: true },
  { key: "propertyType", label: "Property Type", required: false },
  { key: "possessionType", label: "Possession Type", required: false },
  { key: "areaSqft", label: "Area (sq.ft)", required: false },
]

interface ParsedRow {
  rowNumber: number
  input: ListingInput
  errors: string[]
}

function guessColumn(headers: string[], fieldKey: string, fieldLabel: string): string {
  const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  // "Bank (name)" -> "bankname" — strip a parenthetical qualifier so it also matches a bare "Bank" column.
  const targetBare = normalized(fieldLabel.replace(/\(.*?\)/g, ""))
  const target = normalized(fieldLabel)
  const targetKey = normalized(fieldKey)
  const candidates = [target, targetKey, targetBare]

  const exact = headers.find((h) => candidates.includes(normalized(h)))
  if (exact) return exact

  return headers.find((h) => {
    const nh = normalized(h)
    return candidates.some((c) => c.length > 2 && (nh.includes(c) || c.includes(nh)))
  }) ?? ""
}

export function BulkUploadPanel({ banks }: { banks: { id: string; name: string }[] }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [committing, setCommitting] = useState(false)
  const [result, setResult] = useState<{ committed: number } | null>(null)
  const { toast } = useToast()

  const handleFile = async (file: File) => {
    setResult(null)
    const buf = await file.arrayBuffer()
    const workbook = XLSX.read(buf, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
    if (rows.length === 0) {
      toast({ variant: "destructive", title: "No rows found in this file" })
      return
    }
    const detectedHeaders = Object.keys(rows[0])
    setHeaders(detectedHeaders)
    setRawRows(rows)

    const autoMapping: Record<string, string> = {}
    for (const field of TARGET_FIELDS) autoMapping[field.key] = guessColumn(detectedHeaders, field.key, field.label)
    setMapping(autoMapping)
    setParsed([])
  }

  const findBank = (name: string): string | undefined => {
    const normalized = name.trim().toLowerCase()
    return banks.find((b) => b.name.toLowerCase() === normalized || b.name.toLowerCase().includes(normalized) || normalized.includes(b.name.toLowerCase()))?.id
  }

  const buildPreview = () => {
    const rows: ParsedRow[] = rawRows.map((raw, i) => {
      const errors: string[] = []
      const get = (key: keyof ListingInput) => {
        const col = mapping[key]
        return col ? String(raw[col] ?? "").trim() : ""
      }

      const bankName = get("bankId")
      const bankId = bankName ? findBank(bankName) : undefined
      if (bankName && !bankId) errors.push(`Bank "${bankName}" not recognized`)
      else if (!bankName) errors.push("Bank column not mapped or empty")

      const reservePrice = Number(get("reservePrice"))
      const emdAmount = Number(get("emdAmount"))
      const auctionDateRaw = get("auctionDate")
      const emdDeadlineRaw = get("emdDeadline")
      const auctionDate = auctionDateRaw && !isNaN(Date.parse(auctionDateRaw)) ? new Date(auctionDateRaw).toISOString() : ""
      const emdDeadline = emdDeadlineRaw && !isNaN(Date.parse(emdDeadlineRaw)) ? new Date(emdDeadlineRaw).toISOString() : ""

      for (const field of TARGET_FIELDS) {
        if (!field.required) continue
        if (field.key === "bankId") continue
        if (field.key === "reservePrice" && (!reservePrice || reservePrice <= 0)) errors.push("Missing/invalid reserve price")
        else if (field.key === "emdAmount" && (!emdAmount || emdAmount <= 0)) errors.push("Missing/invalid EMD amount")
        else if (field.key === "auctionDate" && !auctionDate) errors.push("Missing/invalid auction date")
        else if (field.key === "emdDeadline" && !emdDeadline) errors.push("Missing/invalid EMD deadline")
        else if (!["reservePrice", "emdAmount", "auctionDate", "emdDeadline"].includes(field.key) && !get(field.key)) errors.push(`Missing ${field.label}`)
      }

      const input: ListingInput = {
        title: get("title"),
        propertyType: (get("propertyType").toLowerCase() as ListingInput["propertyType"]) || "residential",
        possessionType: (get("possessionType").toLowerCase() as ListingInput["possessionType"]) || "physical",
        status: "draft",
        bankId: bankId ?? "",
        addressLine: get("addressLine"),
        locality: get("locality"),
        city: get("city"),
        state: get("state"),
        pincode: get("pincode"),
        reservePrice,
        emdAmount,
        estimatedMarketValue: null,
        auctionDate,
        auctionTime: null,
        mode: "Online e-Auction",
        emdDeadline,
        bidIncreaseAmount: null,
        totalOutstandingDues: null,
        noticeUrl: null,
        areaSqft: get("areaSqft") ? Number(get("areaSqft")) : null,
        bedrooms: null,
        flatNumber: null,
        floor: null,
        inspectionDatetime: null,
        inspectionNotes: null,
        authorisedOfficerName: null,
        authorisedOfficerPhone: null,
        authorisedOfficerEmail: null,
        bankContact: null,
      }

      return { rowNumber: i + 2, input, errors }
    })
    setParsed(rows)
  }

  const validRows = parsed.filter((r) => r.errors.length === 0)

  const handleCommit = async () => {
    setCommitting(true)
    try {
      const result = await bulkCommitListings(validRows.map((r) => r.input))
      setResult(result)
      toast({ title: `${result.committed} listing(s) created as drafts` })
      setParsed([])
      setRawRows([])
    } catch {
      toast({ variant: "destructive", title: "Bulk commit failed" })
    } finally {
      setCommitting(false)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <FormSection title="📂 Bulk Upload Listings via Excel">
        <AlertStrip
          type="info"
          icon="💡"
          title="How bulk upload works"
          subtitle="Upload any .xlsx/.csv file, map its columns to listing fields below, preview and fix errors, then commit — everything is created as a draft, never published directly."
        />
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 hover:border-primary transition-colors mt-4">
          <div className="text-3xl mb-1.5">📊</div>
          <div className="text-sm font-semibold text-foreground mb-0.5">Click to choose your Excel/CSV file</div>
          <div className="text-xs text-muted-foreground">.xlsx, .xls, or .csv</div>
          <label className="mt-3 inline-block h-8.5 px-4 bg-primary text-primary-foreground font-semibold rounded-lg text-[13px] cursor-pointer">
            Choose File
            <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
        </div>

        {result && (
          <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
            ✅ {result.committed} listing(s) committed as drafts. Review them in the Listings tab.
          </div>
        )}
      </FormSection>

      {headers.length > 0 && (
        <FormSection title="Map columns to listing fields">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TARGET_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-foreground">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </span>
                <TcActionSelect
                  value={mapping[field.key] ?? ""}
                  onChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v }))}
                  options={[{ label: "— not mapped —", value: "" }, ...headers.map((h) => ({ label: h, value: h }))]}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={buildPreview} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg">
              Preview {rawRows.length} row(s)
            </button>
          </div>
        </FormSection>
      )}

      {parsed.length > 0 && (
        <FormSection title={`Preview — ${validRows.length} valid, ${parsed.length - validRows.length} with errors`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <Th>Row</Th>
                  <Th>Title</Th>
                  <Th>City</Th>
                  <Th>Reserve Price</Th>
                  <Th>Auction Date</Th>
                  <Th>Errors</Th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((row) => (
                  <tr key={row.rowNumber} className={`border-b border-border ${row.errors.length > 0 ? "bg-red-50/50 dark:bg-red-500/5" : ""}`}>
                    <Td>{row.rowNumber}</Td>
                    <Td>{row.input.title || "—"}</Td>
                    <Td>{row.input.city || "—"}</Td>
                    <Td>{row.input.reservePrice || "—"}</Td>
                    <Td>{row.input.auctionDate ? new Date(row.input.auctionDate).toLocaleDateString("en-IN") : "—"}</Td>
                    <Td className={row.errors.length > 0 ? "text-red-600" : "text-emerald-600"}>{row.errors.length > 0 ? row.errors.join("; ") : "OK"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              disabled={validRows.length === 0 || committing}
              onClick={handleCommit}
              className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[13px] rounded-lg disabled:opacity-50"
            >
              {committing ? "Committing…" : `Commit ${validRows.length} valid row(s) as drafts`}
            </button>
          </div>
        </FormSection>
      )}
    </div>
  )
}
