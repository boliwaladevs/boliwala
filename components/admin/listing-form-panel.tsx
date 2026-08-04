"use client"

import { useEffect, useState, useTransition } from "react"
import { FormSection, Flbl, Finp, Fsel } from "./ui"
import {
  createListing,
  updateListing,
  uploadListingImage,
  deleteListingImage,
  setPrimaryImage,
  getListingForEditAction,
  type ListingInput,
} from "@/app/actions/admin-listings"
import type { AdminEditableListing } from "@/lib/data/admin"
import { useToast } from "@/hooks/use-toast"

const PROPERTY_TYPES = [
  { label: "Residential", value: "residential" },
  { label: "Commercial", value: "commercial" },
  { label: "Industrial", value: "industrial" },
  { label: "Agricultural", value: "agricultural" },
  { label: "Mixed Use", value: "mixed_use" },
]
const POSSESSION_TYPES = [
  { label: "Physical", value: "physical" },
  { label: "Symbolic", value: "symbolic" },
]
const STATUSES = [
  { label: "Draft", value: "draft" },
  { label: "Active (live)", value: "live" },
  { label: "Closed", value: "closed" },
  { label: "Cancelled", value: "cancelled" },
]

const EMPTY_FORM: ListingInput = {
  title: "",
  propertyType: "residential",
  possessionType: "physical",
  status: "draft",
  bankId: "",
  addressLine: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  reservePrice: 0,
  emdAmount: 0,
  estimatedMarketValue: null,
  auctionDate: "",
  auctionTime: null,
  mode: "Online e-Auction",
  emdDeadline: "",
  bidIncreaseAmount: null,
  totalOutstandingDues: null,
  noticeUrl: null,
  areaSqft: null,
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

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ""
  return iso.slice(0, 16)
}

type Tab = "property" | "bank" | "images" | "gated"

export function ListingFormPanel({
  listingId,
  banks,
  onSaved,
  onCancel,
}: {
  listingId: string | null
  banks: { id: string; name: string }[]
  onSaved: (id: string) => void
  onCancel: () => void
}) {
  const [tab, setTab] = useState<Tab>("property")
  const [form, setForm] = useState<ListingInput>(EMPTY_FORM)
  const [images, setImages] = useState<AdminEditableListing["images"]>([])
  const [loading, setLoading] = useState(!!listingId)
  const [saving, startSaving] = useTransition()
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!listingId) {
      setForm(EMPTY_FORM)
      setImages([])
      setLoading(false)
      return
    }
    setLoading(true)
    getListingForEditAction(listingId).then((listing) => {
      if (!listing) {
        toast({ variant: "destructive", title: "Listing not found" })
        setLoading(false)
        return
      }
      setForm({
        title: listing.title,
        propertyType: listing.propertyType,
        possessionType: listing.possessionType,
        status: listing.status,
        bankId: listing.bankId,
        addressLine: listing.addressLine,
        locality: listing.locality,
        city: listing.city,
        state: listing.state,
        pincode: listing.pincode,
        reservePrice: listing.reservePrice,
        emdAmount: listing.emdAmount,
        estimatedMarketValue: listing.estimatedMarketValue,
        auctionDate: listing.auctionDate,
        auctionTime: listing.auctionTime,
        mode: listing.mode,
        emdDeadline: listing.emdDeadline,
        bidIncreaseAmount: listing.bidIncreaseAmount,
        totalOutstandingDues: listing.totalOutstandingDues,
        noticeUrl: listing.noticeUrl,
        areaSqft: listing.areaSqft,
        bedrooms: listing.bedrooms,
        flatNumber: listing.flatNumber,
        floor: listing.floor,
        inspectionDatetime: listing.inspectionDatetime,
        inspectionNotes: listing.inspectionNotes,
        authorisedOfficerName: listing.authorisedOfficerName,
        authorisedOfficerPhone: listing.authorisedOfficerPhone,
        authorisedOfficerEmail: listing.authorisedOfficerEmail,
        bankContact: listing.bankContact,
      })
      setImages(listing.images)
      setLoading(false)
    })
  }, [listingId, toast])

  const set = <K extends keyof ListingInput>(key: K, value: ListingInput[K]) => setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    if (!form.title || !form.bankId || !form.city || !form.reservePrice || !form.auctionDate) {
      toast({ variant: "destructive", title: "Missing required fields", description: "Title, bank, city, reserve price and auction date are required." })
      return
    }
    startSaving(async () => {
      try {
        if (listingId) {
          await updateListing(listingId, form)
          toast({ title: "Listing saved" })
          onSaved(listingId)
        } else {
          const { id } = await createListing(form)
          toast({ title: "Listing created", description: "Now add photos in the Images tab." })
          onSaved(id)
        }
      } catch {
        toast({ variant: "destructive", title: "Couldn't save listing" })
      }
    })
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !listingId) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.set("listingId", listingId)
      formData.set("file", file)
      try {
        const { id, url } = await uploadListingImage(formData)
        setImages((prev) => [...prev, { id, url, sortOrder: prev.length, isPrimary: prev.length === 0 }])
      } catch {
        toast({ variant: "destructive", title: `Couldn't upload ${file.name}` })
      }
    }
    setUploading(false)
  }

  const handleDeleteImage = async (imageId: string) => {
    const previous = images
    setImages((prev) => prev.filter((i) => i.id !== imageId))
    try {
      await deleteListingImage(imageId)
    } catch {
      setImages(previous)
      toast({ variant: "destructive", title: "Couldn't delete image" })
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!listingId) return
    setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === imageId })))
    await setPrimaryImage(listingId, imageId).catch(() => toast({ variant: "destructive", title: "Couldn't update cover photo" }))
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onCancel} className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">
          ← Back
        </button>
        <div className="font-display text-base font-bold text-foreground">{listingId ? `Edit: ${form.title || "Listing"}` : "Add New Listing"}</div>
      </div>

      <div className="flex border-b-2 border-border mb-4 overflow-x-auto">
        {([
          ["property", "Property Details"],
          ["bank", "Bank & Auction"],
          ["images", "📷 Images & PDF"],
          ["gated", "Gated Fields"],
        ] as [Tab, string][]).map(([id, label]) => (
          <div
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-[13px] cursor-pointer font-medium whitespace-nowrap -mb-[2px] border-b-2 ${tab === id ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent"}`}
          >
            {label}
          </div>
        ))}
      </div>

      {tab === "property" && (
        <FormSection
          title="Property Details"
          foot={
            <>
              <button onClick={onCancel} className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Flbl>Title *</Flbl>
              <Finp value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Flat 303, Vithai Apartment, Airoli" />
            </div>
            <div>
              <Flbl>Property Type</Flbl>
              <Fsel options={PROPERTY_TYPES} value={form.propertyType} onChange={(v) => set("propertyType", v as ListingInput["propertyType"])} />
            </div>
            <div>
              <Flbl>Possession Type</Flbl>
              <Fsel options={POSSESSION_TYPES} value={form.possessionType} onChange={(v) => set("possessionType", v as ListingInput["possessionType"])} />
            </div>
            <div className="md:col-span-2">
              <Flbl>Address Line *</Flbl>
              <Finp value={form.addressLine} onChange={(v) => set("addressLine", v)} placeholder="Building, plot, street" />
            </div>
            <div>
              <Flbl>Locality</Flbl>
              <Finp value={form.locality} onChange={(v) => set("locality", v)} />
            </div>
            <div>
              <Flbl>City *</Flbl>
              <Finp value={form.city} onChange={(v) => set("city", v)} />
            </div>
            <div>
              <Flbl>State</Flbl>
              <Finp value={form.state} onChange={(v) => set("state", v)} />
            </div>
            <div>
              <Flbl>Pincode</Flbl>
              <Finp value={form.pincode} onChange={(v) => set("pincode", v)} />
            </div>
            <div>
              <Flbl>Area (sq.ft)</Flbl>
              <Finp type="number" value={form.areaSqft ?? ""} onChange={(v) => set("areaSqft", v ? Number(v) : null)} />
            </div>
            <div>
              <Flbl>Bedrooms</Flbl>
              <Finp type="number" value={form.bedrooms ?? ""} onChange={(v) => set("bedrooms", v ? Number(v) : null)} />
            </div>
          </div>
        </FormSection>
      )}

      {tab === "bank" && (
        <FormSection
          title="Bank & Auction"
          foot={
            <>
              <button onClick={onCancel} className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Flbl>Bank *</Flbl>
              <Fsel options={[{ label: "Select a bank…", value: "" }, ...banks.map((b) => ({ label: b.name, value: b.id }))]} value={form.bankId} onChange={(v) => set("bankId", v)} />
            </div>
            <div>
              <Flbl>Status</Flbl>
              <Fsel options={STATUSES} value={form.status} onChange={(v) => set("status", v as ListingInput["status"])} />
            </div>
            <div>
              <Flbl>Reserve Price (₹) *</Flbl>
              <Finp type="number" value={form.reservePrice || ""} onChange={(v) => set("reservePrice", Number(v))} />
            </div>
            <div>
              <Flbl>EMD Amount (₹) *</Flbl>
              <Finp type="number" value={form.emdAmount || ""} onChange={(v) => set("emdAmount", Number(v))} />
            </div>
            <div>
              <Flbl>Estimated Market Value (₹)</Flbl>
              <Finp type="number" value={form.estimatedMarketValue ?? ""} onChange={(v) => set("estimatedMarketValue", v ? Number(v) : null)} />
            </div>
            <div>
              <Flbl>Bid Increase Amount (₹)</Flbl>
              <Finp type="number" value={form.bidIncreaseAmount ?? ""} onChange={(v) => set("bidIncreaseAmount", v ? Number(v) : null)} />
            </div>
            <div>
              <Flbl>Auction Date *</Flbl>
              <Finp type="datetime-local" value={toDatetimeLocal(form.auctionDate)} onChange={(v) => set("auctionDate", v ? new Date(v).toISOString() : "")} />
            </div>
            <div>
              <Flbl>Auction Time (display text)</Flbl>
              <Finp value={form.auctionTime ?? ""} onChange={(v) => set("auctionTime", v || null)} placeholder="e.g. 02:00 PM – 04:00 PM" />
            </div>
            <div>
              <Flbl>EMD Deadline *</Flbl>
              <Finp type="datetime-local" value={toDatetimeLocal(form.emdDeadline)} onChange={(v) => set("emdDeadline", v ? new Date(v).toISOString() : "")} />
            </div>
            <div>
              <Flbl>Mode</Flbl>
              <Finp value={form.mode ?? ""} onChange={(v) => set("mode", v || null)} placeholder="Online e-Auction" />
            </div>
            <div>
              <Flbl>Total Outstanding Dues (₹)</Flbl>
              <Finp type="number" value={form.totalOutstandingDues ?? ""} onChange={(v) => set("totalOutstandingDues", v ? Number(v) : null)} />
            </div>
            <div>
              <Flbl>Bank Notice PDF URL</Flbl>
              <Finp value={form.noticeUrl ?? ""} onChange={(v) => set("noticeUrl", v || null)} placeholder="https://…" />
            </div>
          </div>
        </FormSection>
      )}

      {tab === "images" && (
        <FormSection title="📷 Property Images">
          {!listingId ? (
            <div className="text-sm text-muted-foreground">Save the listing first, then come back here to add photos.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <div key={img.id} className="aspect-square rounded-lg relative border-2 overflow-hidden group" style={{ borderColor: img.isPrimary ? "var(--primary)" : "transparent" }}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center cursor-pointer" onClick={() => handleDeleteImage(img.id)}>
                    ✕
                  </div>
                  {!img.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      className="absolute bottom-1 left-1 right-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set as cover
                    </button>
                  )}
                  {img.isPrimary && <div className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5">Cover</div>}
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground rounded-lg cursor-pointer hover:bg-muted/50 hover:border-primary hover:text-primary">
                <span className="text-xl">{uploading ? "…" : "+"}</span>
                <span className="text-[11px] mt-1">{uploading ? "Uploading" : "Add"}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading} onChange={(e) => handleUpload(e.target.files)} />
              </label>
            </div>
          )}
        </FormSection>
      )}

      {tab === "gated" && (
        <FormSection
          title="Gated Fields — unlocked only for paying users"
          foot={
            <>
              <button onClick={onCancel} className="h-9 px-3.5 bg-background border-2 border-border text-muted-foreground text-[13px] rounded-lg">
                Cancel
              </button>
              <button disabled={saving} onClick={handleSave} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg disabled:opacity-60">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Flbl>Flat Number</Flbl>
              <Finp value={form.flatNumber ?? ""} onChange={(v) => set("flatNumber", v || null)} />
            </div>
            <div>
              <Flbl>Floor</Flbl>
              <Finp value={form.floor ?? ""} onChange={(v) => set("floor", v || null)} />
            </div>
            <div>
              <Flbl>Inspection Date & Time</Flbl>
              <Finp type="datetime-local" value={toDatetimeLocal(form.inspectionDatetime)} onChange={(v) => set("inspectionDatetime", v ? new Date(v).toISOString() : null)} />
            </div>
            <div>
              <Flbl>Inspection Notes</Flbl>
              <Finp value={form.inspectionNotes ?? ""} onChange={(v) => set("inspectionNotes", v || null)} />
            </div>
            <div>
              <Flbl>Authorised Officer Name</Flbl>
              <Finp value={form.authorisedOfficerName ?? ""} onChange={(v) => set("authorisedOfficerName", v || null)} />
            </div>
            <div>
              <Flbl>Authorised Officer Phone</Flbl>
              <Finp value={form.authorisedOfficerPhone ?? ""} onChange={(v) => set("authorisedOfficerPhone", v || null)} />
            </div>
            <div>
              <Flbl>Authorised Officer Email</Flbl>
              <Finp value={form.authorisedOfficerEmail ?? ""} onChange={(v) => set("authorisedOfficerEmail", v || null)} />
            </div>
            <div>
              <Flbl>Bank Contact</Flbl>
              <Finp value={form.bankContact ?? ""} onChange={(v) => set("bankContact", v || null)} />
            </div>
          </div>
        </FormSection>
      )}
    </div>
  )
}
