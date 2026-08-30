"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, Share2, Download, ChevronLeft, ChevronRight, Check, Search, Scale, Lock, MapPin, Eye, MessageSquare, Bookmark } from "lucide-react"
import { toggleShortlist } from "@/app/actions/shortlist"
import { unlockFieldGroup } from "@/app/actions/unlock"
import { useToast } from "@/hooks/use-toast"
import { currentPath, withNext } from "@/lib/auth/next-param"
import { formatDateLong, formatDateShort, formatINR } from "@/lib/format"
import type { SafeListing } from "@/lib/access/redact"
import type { AccessState, FieldGroup, GateDecision } from "@/lib/access/types"
import type { PricingSettings } from "@/lib/access/types"
import type { SearchListing } from "@/lib/data/listings"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  agricultural: "Agricultural",
  mixed_use: "Mixed Use",
}

function UnlockCta({
  listingId,
  group,
  decision,
  label,
}: {
  listingId: string
  group: FieldGroup
  decision: Extract<GateDecision, { visible: false }>
  label: string
}) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  if (decision.action === "signup") {
    return (
      <Link href="/signup" className="text-orange-400 font-semibold cursor-pointer hover:underline not-italic inline-flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Sign up to view
      </Link>
    )
  }

  if (decision.action === "upgrade") {
    return (
      <Link href="/pricing" className="text-orange-400 font-semibold cursor-pointer hover:underline not-italic inline-flex items-center gap-1.5">
        <Lock className="w-3.5 h-3.5" /> Need {decision.shortfall} more credit{decision.shortfall === 1 ? "" : "s"} — Upgrade
      </Link>
    )
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await unlockFieldGroup(listingId, group)
          if (result.ok) {
            toast({ title: `${label} unlocked`, description: `${decision.cost} credit${decision.cost === 1 ? "" : "s"} spent.` })
            router.refresh()
          } else if (result.error === "not_authenticated") {
            toast({ variant: "destructive", title: "Sign in required" })
            router.push(withNext("/login", currentPath()))
          } else if (result.error === "insufficient_credits") {
            toast({ variant: "destructive", title: "Not enough credits", description: "Upgrade to Annual for unlimited access." })
          } else {
            toast({ variant: "destructive", title: "Couldn't unlock", description: "Please try again." })
          }
        })
      }
      className="text-orange-400 font-semibold cursor-pointer hover:underline not-italic inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <Lock className="w-3.5 h-3.5" /> {isPending ? "Unlocking…" : `Unlock for ${decision.cost} credit${decision.cost === 1 ? "" : "s"}`}
    </button>
  )
}

export function ListingView({
  listing,
  access,
  settings,
  similar,
  isShortlisted: initialShortlisted,
  isSignedIn,
}: {
  listing: SafeListing
  access: { state: AccessState; creditBalance: number }
  settings: PricingSettings
  similar: SearchListing[]
  isShortlisted: boolean
  isSignedIn: boolean
}) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [saved, setSaved] = useState(initialShortlisted)
  const [, startShortlistTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const images = listing.images
  const totalSlides = Math.max(1, images.length)
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)

  const handleSave = () => {
    if (!isSignedIn) {
      toast({ title: "Sign in to save properties" })
      router.push(withNext("/login", currentPath()))
      return
    }
    const wasSaved = saved
    setSaved(!wasSaved)
    startShortlistTransition(async () => {
      const result = await toggleShortlist(listing.id)
      if ("error" in result) {
        setSaved(wasSaved)
        toast({ variant: "destructive", title: "Couldn't update shortlist" })
      }
    })
  }

  const inspection = listing.gated.inspection
  const officerContact = listing.gated.officer_contact
  const flatFloor = listing.gated.flat_floor

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 flex-wrap">
        <Link href="/" className="hover:text-orange-400 transition-colors cursor-pointer">Home</Link>
        <span className="text-border">›</span>
        <Link href={`/search?location=${encodeURIComponent(listing.city)}`} className="hover:text-orange-400 transition-colors cursor-pointer">{listing.city}</Link>
        <span className="text-border">›</span>
        <Link href={`/search?location=${encodeURIComponent(listing.locality)}`} className="hover:text-orange-400 transition-colors cursor-pointer">{listing.locality}</Link>
        <span className="text-border">›</span>
        <Link href={`/search?bank=${listing.bank.id}`} className="hover:text-orange-400 transition-colors cursor-pointer">{listing.bank.name}</Link>
        <span className="text-border">›</span>
        <span className="text-foreground font-medium">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
        {/* LEFT COLUMN */}
        <div>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="inline-flex items-center gap-1.5 bg-secondary/50 border border-border rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Eye className="w-3.5 h-3.5" /> <span className="text-orange-400 font-bold">{listing.viewCount}</span> people viewed this
            </div>
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${saved ? "bg-orange-400/10 text-orange-400 border-orange-400/30" : "bg-background border-border hover:border-orange-400 hover:text-orange-400 text-muted-foreground"}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "Save"}
            </button>
            <button className="inline-flex items-center gap-1.5 bg-background border border-border hover:border-orange-400 hover:text-orange-400 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            {listing.noticeUrl && (
              <a href={listing.noticeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-background border border-border hover:border-orange-400 hover:text-orange-400 rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors">
                <Download className="w-3.5 h-3.5" /> Download Notice
              </a>
            )}
          </div>

          {/* Carousel */}
          <div className="relative rounded-xl overflow-hidden h-[300px] md:h-[400px] mb-6 bg-slate-900 group">
            {images.length > 0 ? (
              <>
                <div className="absolute top-4 right-4 bg-black/60 text-white text-sm font-semibold px-3 py-1 rounded-full backdrop-blur-sm z-10">
                  <span>{currentSlide + 1}</span> / {totalSlides}
                </div>
                <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`${listing.title} photo ${i + 1}`} className="min-w-full h-full object-cover" />
                  ))}
                </div>
                <button onClick={prevSlide} className="absolute top-1/2 -translate-y-1/2 left-4 w-10 h-10 rounded-full bg-white/95 text-foreground flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextSlide} className="absolute top-1/2 -translate-y-1/2 right-4 w-10 h-10 rounded-full bg-white/95 text-foreground flex items-center justify-center shadow-lg hover:bg-white hover:scale-105 transition-all z-10 opacity-0 group-hover:opacity-100 focus:opacity-100">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 bg-gradient-to-br from-secondary/80 to-secondary">
                <Building2 className="w-16 h-16 mb-2" />
                <span className="text-xs">No photos available yet</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100/80 text-emerald-700 border border-emerald-200 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
              <Check className="w-3.5 h-3.5" /> {listing.bank.name} — SARFAESI
            </span>
            <span className="inline-flex items-center gap-1.5 bg-amber-100/80 text-amber-700 border border-amber-200 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
              📅 Auction: {formatDateShort(listing.auctionDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-secondary/80 text-muted-foreground border border-border text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md">
              {listing.possessionType === "physical" ? "🔑 Physical Possession" : "📝 Symbolic Possession"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3 leading-tight">{listing.title}</h1>
          <div className="text-sm text-muted-foreground flex items-start gap-1.5 mb-8 leading-relaxed">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            {listing.addressLine}, {listing.locality}, {listing.city}, {listing.state} – {listing.pincode}
          </div>

          {/* Property Details Table */}
          <div className="bg-background border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/30">
              <div className="w-9 h-9 rounded-md bg-blue-100 flex items-center justify-center shrink-0 text-blue-600"><Building2 className="w-5 h-5" /></div>
              <h2 className="text-base font-bold text-foreground">Property Details</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground w-[40%] md:w-1/3">Property Type</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{PROPERTY_TYPE_LABELS[listing.propertyType]}</td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Flat No. & Floor</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">
                      {flatFloor.decision.visible ? (
                        <span>{flatFloor.value?.flatNumber ?? "—"}{flatFloor.value?.floor ? `, Floor ${flatFloor.value.floor}` : ""}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground italic font-normal">
                          <UnlockCta listingId={listing.id} group="flat_floor" decision={flatFloor.decision} label="Flat number & floor" />
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Locality</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{listing.locality}, {listing.city}</td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">District</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{listing.state} – {listing.pincode}</td>
                  </tr>
                  {listing.areaSqft && (
                    <tr className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5 text-muted-foreground">Area</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">~{listing.areaSqft} sq.ft</td>
                    </tr>
                  )}
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Possession Type</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{listing.possessionType === "physical" ? "Physical Possession" : "Symbolic Possession"}</td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Property ID</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{listing.slug}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Auction Information */}
          <div className="bg-background border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/30">
              <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center shrink-0 text-amber-600"><span className="text-xl">📅</span></div>
              <h2 className="text-base font-bold text-foreground">Auction Information</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground w-[40%] md:w-1/3">Auction Date</td>
                    <td className="px-6 py-3.5 font-bold text-foreground">{formatDateLong(listing.auctionDate)}</td>
                  </tr>
                  {listing.auctionTime && (
                    <tr className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5 text-muted-foreground">Auction Time</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{listing.auctionTime}</td>
                    </tr>
                  )}
                  {listing.mode && (
                    <tr className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5 text-muted-foreground">Mode</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{listing.mode}</td>
                    </tr>
                  )}
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Reserve Price</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{formatINR(listing.reservePrice)}</td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">EMD Amount</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">{formatINR(listing.emdAmount)}</td>
                  </tr>
                  {listing.bidIncreaseAmount != null && (
                    <tr className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5 text-muted-foreground">Bid Increase Amount</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{formatINR(listing.bidIncreaseAmount)}</td>
                    </tr>
                  )}
                  {listing.totalOutstandingDues != null && (
                    <tr className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-3.5 text-muted-foreground">Total Outstanding Dues</td>
                      <td className="px-6 py-3.5 font-medium text-foreground">{formatINR(listing.totalOutstandingDues)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspection */}
          <div className="bg-background border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/30">
              <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0 text-muted-foreground"><Search className="w-5 h-5" /></div>
              <h2 className="text-base font-bold text-foreground">Inspection</h2>
            </div>
            {inspection.decision.visible ? (
              <div className="px-6 py-5 text-sm">
                <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Date & Time</span><span className="font-medium text-foreground">{inspection.value?.inspectionDatetime ? formatDateLong(inspection.value.inspectionDatetime) : "To be announced"}</span></div>
                {inspection.value?.inspectionNotes && <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Notes</span><span className="font-medium text-foreground">{inspection.value.inspectionNotes}</span></div>}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <Lock className="w-6 h-6 mx-auto mb-3 text-blue-600" />
                <p className="text-sm text-muted-foreground mb-4">Inspection date & time are available after unlocking.</p>
                <UnlockCta listingId={listing.id} group="inspection" decision={inspection.decision} label="Inspection date & time" />
              </div>
            )}
          </div>

          {/* Officer / Bank Contact */}
          <div className="bg-background border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/30">
              <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0 text-muted-foreground"><Search className="w-5 h-5" /></div>
              <h2 className="text-base font-bold text-foreground">Authorised Officer & Bank Contact</h2>
            </div>
            {officerContact.decision.visible ? (
              <div className="px-6 py-5 text-sm space-y-1.5">
                {officerContact.value?.authorisedOfficerName && <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Officer</span><span className="font-medium text-foreground">{officerContact.value.authorisedOfficerName}</span></div>}
                {officerContact.value?.authorisedOfficerPhone && <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Phone</span><span className="font-medium text-foreground">{officerContact.value.authorisedOfficerPhone}</span></div>}
                {officerContact.value?.authorisedOfficerEmail && <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Email</span><span className="font-medium text-foreground">{officerContact.value.authorisedOfficerEmail}</span></div>}
                {officerContact.value?.bankContact && <div className="flex justify-between py-1.5"><span className="text-muted-foreground">Bank Contact</span><span className="font-medium text-foreground">{officerContact.value.bankContact}</span></div>}
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <Lock className="w-6 h-6 mx-auto mb-3 text-blue-600" />
                <p className="text-sm text-muted-foreground mb-4">The bank's authorised officer contact is available after unlocking.</p>
                <UnlockCta listingId={listing.id} group="officer_contact" decision={officerContact.decision} label="Authorised officer & bank contact" />
              </div>
            )}
          </div>

          {/* Legal Status */}
          <div className="bg-background border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-secondary/30">
              <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-600"><Scale className="w-5 h-5" /></div>
              <h2 className="text-base font-bold text-foreground">Legal Status</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground w-[40%] md:w-1/3">Sale Under</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">SARFAESI Act 2002 (Rule 6(2) & 8(6))</td>
                  </tr>
                  <tr className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-3.5 text-muted-foreground">Sale Basis</td>
                    <td className="px-6 py-3.5 font-medium text-foreground">&ldquo;As is where is&rdquo;, &ldquo;As is what is&rdquo;, &ldquo;Whatever there is&rdquo;</td>
                  </tr>
                  <tr className="bg-orange-400/10">
                    <td className="px-6 py-3.5 text-foreground font-medium">Our Recommendation</td>
                    <td className="px-6 py-3.5 font-bold text-orange-500">Book Due Diligence before bidding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-5 text-sm text-amber-900/80 leading-relaxed">
            <strong className="text-amber-600">⚠️ Important:</strong> This property is sold on an <strong>&ldquo;As is where is&rdquo;, &ldquo;As is what is&rdquo;</strong> and <strong>&ldquo;Whatever there is&rdquo;</strong> basis. Intending bidders should make their own independent enquiries and verify the property, title, encumbrances, dues and statutory charges before bidding. Source: {listing.bank.name} E-Auction Sale Notice.
          </div>
        </div>

        {/* RIGHT COLUMN (Action Card) */}
        <div>
          <div className="bg-background border border-border rounded-xl shadow-md p-6 lg:sticky lg:top-24">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Reserve Price</span>
            <div className="text-3xl font-extrabold tracking-tight text-foreground mb-3">{formatINR(listing.reservePrice)}</div>
            <div className="text-sm text-muted-foreground pt-3 border-t border-border mb-2">
              EMD Required: <strong className="text-red-500 font-semibold">{formatINR(listing.emdAmount)}</strong>
            </div>
            {listing.bidIncreaseAmount != null && (
              <div className="text-xs text-muted-foreground mb-5">Bid Increase Amount: {formatINR(listing.bidIncreaseAmount)}</div>
            )}

            <div className="bg-amber-100/50 border border-amber-200/50 rounded-lg p-3 flex items-center gap-3 mb-3">
              <span className="text-2xl">📅</span>
              <div>
                <strong className="block text-sm font-bold text-amber-600">Auction: {formatDateLong(listing.auctionDate)}</strong>
                <span className="text-xs text-muted-foreground">{listing.auctionTime ?? ""}{listing.mode ? ` · ${listing.mode}` : ""}</span>
              </div>
            </div>

            {inspection.decision.visible && inspection.value?.inspectionDatetime && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-center gap-3 mb-6">
                <span className="text-xl text-blue-500"><Search className="w-6 h-6" /></span>
                <div>
                  <strong className="block text-sm font-bold text-blue-600">Inspection: {formatDateLong(inspection.value.inspectionDatetime)}</strong>
                </div>
              </div>
            )}

            <Link href="/services" className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 rounded-md mb-2 transition-colors flex items-center justify-center">
              🎯 Hire Boliwala to Bid
            </Link>
            <button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold py-3 rounded-md mb-2 flex items-center justify-center gap-2 transition-colors">
              <MessageSquare className="w-4 h-4" /> WhatsApp Us Now
            </button>
            <Link href={`/contact?listing=${listing.slug}`} className="w-full bg-transparent border border-border hover:bg-secondary text-foreground font-medium py-3 rounded-md mb-2 flex items-center justify-center gap-2 transition-colors">
              📞 Request a Callback
            </Link>
            {listing.noticeUrl && (
              <a href={listing.noticeUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-transparent border border-border hover:bg-secondary text-foreground font-medium py-3 rounded-md flex items-center justify-center gap-2 transition-colors">
                📄 Download Bank Notice (PDF)
              </a>
            )}

            <div className="h-px bg-border my-6"></div>

            <div className="bg-secondary/30 border border-border rounded-xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-bold text-foreground">Complete End-to-End Package</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <span className="text-2xl font-extrabold text-orange-400 tracking-tight">{formatINR(settings.servicePackagePrice)}</span>
                <span className="text-sm font-semibold text-muted-foreground">+</span>
                <span className="text-lg font-extrabold text-amber-500">{settings.successFeePct}%</span>
                <span className="text-sm font-semibold text-muted-foreground">success fee</span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full mb-4">
                ✓ {settings.successFeePct}% charged only if you win
              </div>
              <ul className="space-y-1.5">
                {["Due Diligence & Legal Search", "Auction Bid Management", "Possession Support", "Loan & Funding Assistance"].map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/services" className="w-full bg-foreground text-background font-semibold py-3 rounded-md hover:bg-foreground/90 transition-colors mb-4 flex items-center justify-center">
              Get Started — {formatINR(settings.servicePackagePrice)}
            </Link>

            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/50 rounded-md p-3 text-xs text-emerald-700 font-medium mb-4">
              <span className="text-lg">🆓</span> All property details are free on Boliwala — no paywall, no hidden address.
            </div>

            <div className="text-[11px] text-muted-foreground leading-relaxed pt-4 border-t border-border">
              <strong className="text-foreground">Everything included.</strong> One flat fee of {formatINR(settings.servicePackagePrice)} engages our full team, plus a {settings.successFeePct}% success fee on the winning bid — charged only if you win.
            </div>
          </div>
        </div>
      </div>

      {/* SIMILAR AUCTIONS */}
      {similar.length > 0 && (
        <div className="mt-16 pt-16 border-t border-border">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 block mb-2">Same City</span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Other Auctions in {listing.city}</h2>
            </div>
            <Link href={`/search?location=${encodeURIComponent(listing.city)}`} className="text-sm font-semibold text-orange-400 cursor-pointer hover:underline">
              View all {listing.city} auctions →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similar.map((s) => (
              <Link href={`/listing/${s.slug}`} key={s.id} className="bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-1 flex flex-col overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center relative">
                  <Building2 className="w-12 h-12 text-muted-foreground/30" />
                  <div className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{s.bank.shortName}</div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded backdrop-blur-sm">📅 {formatDateShort(s.auctionDate)}</div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xl font-bold text-foreground tracking-tight">{formatINR(s.reservePrice)}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reserve Price</div>
                  <div className="text-sm font-semibold text-foreground mb-1 leading-snug">{s.title}</div>
                  <div className="text-xs text-muted-foreground mb-3">📍 {s.locality}, {s.city}</div>

                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">EMD: <strong className="text-red-500">{formatINR(s.emdAmount)}</strong></span>
                    <span className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-3 py-1.5 rounded-md text-xs transition-colors">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
