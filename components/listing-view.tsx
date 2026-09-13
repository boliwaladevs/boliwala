"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Share2, Download, ChevronLeft, ChevronRight, Check, Lock, Eye, MessageSquare, Bookmark, Phone, FileText } from "lucide-react"
import { toggleShortlist } from "@/app/actions/shortlist"
import { unlockFieldGroup } from "@/app/actions/unlock"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { currentPath, withNext } from "@/lib/auth/next-param"
import { formatDateLong, formatDateShort, formatINR, reservePricePerSqft } from "@/lib/format"
import { PhotoSlot } from "@/components/photo-slot"
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

const CHIP = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-1.5 text-[11.5px] font-bold"
const OUTLINE_CHIP = `${CHIP} border border-line bg-paper text-ink2 transition-colors hover:bg-surface`
const PANEL = "mb-4 overflow-hidden rounded-card border border-line bg-paper"
const KEY_CELL = "w-[42%] px-5 py-3 align-top text-sm text-ink2"
const VAL_CELL = "px-5 py-3 align-top text-sm font-semibold tabular-nums text-ink"

function PanelHeader({ title, source }: { title: string; source: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-4">
      <h2 className="font-serif text-[19px] font-semibold text-ink">{title}</h2>
      <span className="text-[11.5px] text-ink2">{source}</span>
    </div>
  )
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
      <Link href="/signup" className="inline-flex cursor-pointer items-center gap-1.5 font-semibold not-italic text-brand hover:underline">
        <Lock className="h-3.5 w-3.5" /> Sign up to view
      </Link>
    )
  }

  if (decision.action === "upgrade") {
    return (
      <Link href="/pricing" className="inline-flex cursor-pointer items-center gap-1.5 font-semibold not-italic text-brand hover:underline">
        <Lock className="h-3.5 w-3.5" /> Need {decision.shortfall} more credit{decision.shortfall === 1 ? "" : "s"} — Upgrade
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
      className="inline-flex cursor-pointer items-center gap-1.5 font-semibold not-italic text-brand hover:underline disabled:opacity-50"
    >
      <Lock className="h-3.5 w-3.5" /> {isPending ? "Unlocking…" : `Unlock for ${decision.cost} credit${decision.cost === 1 ? "" : "s"}`}
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
  const perSqft = reservePricePerSqft(listing.reservePrice, listing.areaSqft)

  const keyFigures = [
    { label: "Reserve price", value: formatINR(listing.reservePrice), note: perSqft ?? "As per notice" },
    { label: "EMD", value: formatINR(listing.emdAmount), note: `Due ${formatDateShort(listing.auctionDate)}` },
    ...(listing.bidIncreaseAmount != null
      ? [{ label: "Bid increment", value: formatINR(listing.bidIncreaseAmount), note: "Per bid" }]
      : []),
    ...(listing.totalOutstandingDues != null
      ? [{ label: "Outstanding dues", value: formatINR(listing.totalOutstandingDues), note: "As per notice" }]
      : []),
  ]

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-ink2">
        <Link href="/" className="transition-colors hover:text-ink">Home</Link>
        <span className="opacity-40">/</span>
        <Link href={`/search?location=${encodeURIComponent(listing.city)}`} className="transition-colors hover:text-ink">{listing.city}</Link>
        <span className="opacity-40">/</span>
        <Link href={`/search?location=${encodeURIComponent(listing.locality)}`} className="transition-colors hover:text-ink">{listing.locality}</Link>
        <span className="opacity-40">/</span>
        <Link href={`/search?bank=${listing.lender.id}`} className="transition-colors hover:text-ink">{listing.lender.name}</Link>
        <span className="opacity-40">/</span>
        <span className="font-semibold text-ink">{listing.title}</span>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        {/* LEFT COLUMN */}
        <div className="min-w-0 flex-[999_1_380px]">
          {/* Gallery */}
          {images.length > 0 ? (
            <div className="group relative mb-5 h-[300px] overflow-hidden rounded-card bg-slot md:h-[400px]">
              <div className="absolute right-4 top-4 z-10 rounded-pill bg-[rgba(24,20,16,0.78)] px-3 py-1 text-sm font-semibold tabular-nums text-white backdrop-blur-[6px]">
                <span>{currentSlide + 1}</span> / {totalSlides}
              </div>
              <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`${listing.title} photo ${i + 1}`} className="h-full min-w-full object-cover" />
                ))}
              </div>
              <button onClick={prevSlide} aria-label="Previous photo" className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink opacity-0 shadow-panel transition-opacity focus:opacity-100 group-hover:opacity-100">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={nextSlide} aria-label="Next photo" className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink opacity-0 shadow-panel transition-opacity focus:opacity-100 group-hover:opacity-100">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="mb-5 grid gap-2.5 md:grid-cols-3">
              <PhotoSlot label="Main property photograph" ratio="16 / 9" className="rounded-card md:col-span-2" />
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
                <PhotoSlot label="Interior" ratio="16 / 9" className="rounded-card" />
                <PhotoSlot label="Sale notice scan" ratio="16 / 9" className="rounded-card" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`${CHIP} border border-line bg-paper text-ink2`}>
              <Eye className="h-3.5 w-3.5" /> <span className="font-bold tabular-nums text-brand">{listing.viewCount}</span> people viewed this
            </span>
            <button
              onClick={handleSave}
              className={cn(OUTLINE_CHIP, saved && "border-brand bg-brand-soft text-brand hover:bg-brand-soft")}
            >
              <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} /> {saved ? "Saved" : "Save"}
            </button>
            <button className={OUTLINE_CHIP}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            {listing.noticeUrl && (
              <a href={listing.noticeUrl} target="_blank" rel="noopener noreferrer" className={OUTLINE_CHIP}>
                <Download className="h-3.5 w-3.5" /> Download Notice
              </a>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`${CHIP} bg-pos-soft text-pos`}>
              <Check className="h-3.5 w-3.5" /> {listing.lender.name} — SARFAESI
            </span>
            <span className={`${CHIP} bg-gold-soft text-gold`}>Auction: {formatDateShort(listing.auctionDate)}</span>
            <span className={cn(CHIP, listing.possessionType === "physical" ? "bg-pos-soft text-pos" : "border border-line bg-paper text-ink2")}>
              {listing.possessionType === "physical" ? "Physical Possession" : "Symbolic Possession"}
            </span>
          </div>

          <h1 className="mb-2 font-serif text-[30px] font-semibold leading-[1.12] tracking-[-0.025em] text-ink md:text-[38px]">
            {listing.title}
          </h1>
          <div className="mb-6 text-[15px] leading-relaxed text-ink2">
            {listing.addressLine}, {listing.locality}, {listing.city}, {listing.state} – {listing.pincode}
          </div>

          {/* Key figures */}
          <div className="mb-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {keyFigures.map((f) => (
              <div key={f.label} className="rounded-block border border-line bg-paper px-[18px] py-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">{f.label}</div>
                <div className="my-1 font-serif text-[23px] font-semibold tracking-[-0.02em] text-ink">{f.value}</div>
                <div className="text-xs text-ink2">{f.note}</div>
              </div>
            ))}
          </div>

          {/* Property Details */}
          <div className={PANEL}>
            <PanelHeader title="Property Details" source={`Source: ${listing.lender.name} sale notice`} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className={KEY_CELL}>Property Type</td>
                    <td className={VAL_CELL}>{PROPERTY_TYPE_LABELS[listing.propertyType]}</td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>Flat No. &amp; Floor</td>
                    <td className={VAL_CELL}>
                      {flatFloor.decision.visible ? (
                        <span>{flatFloor.value?.flatNumber ?? "—"}{flatFloor.value?.floor ? `, Floor ${flatFloor.value.floor}` : ""}</span>
                      ) : (
                        <UnlockCta listingId={listing.id} group="flat_floor" decision={flatFloor.decision} label="Flat number & floor" />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>Locality</td>
                    <td className={VAL_CELL}>{listing.locality}, {listing.city}</td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>District</td>
                    <td className={VAL_CELL}>{listing.state} – {listing.pincode}</td>
                  </tr>
                  {listing.areaSqft && (
                    <tr>
                      <td className={KEY_CELL}>Area</td>
                      <td className={VAL_CELL}>~{listing.areaSqft} sq.ft</td>
                    </tr>
                  )}
                  <tr>
                    <td className={KEY_CELL}>Possession Type</td>
                    <td className={VAL_CELL}>{listing.possessionType === "physical" ? "Physical Possession" : "Symbolic Possession"}</td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>Property ID</td>
                    <td className={VAL_CELL}>{listing.slug}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Auction Information */}
          <div className={PANEL}>
            <PanelHeader title="Auction Information" source={`Source: ${listing.lender.name} sale notice`} />
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className={KEY_CELL}>Auction Date</td>
                    <td className={VAL_CELL}>{formatDateLong(listing.auctionDate)}</td>
                  </tr>
                  {listing.auctionTime && (
                    <tr>
                      <td className={KEY_CELL}>Auction Time</td>
                      <td className={VAL_CELL}>{listing.auctionTime}</td>
                    </tr>
                  )}
                  {listing.mode && (
                    <tr>
                      <td className={KEY_CELL}>Mode</td>
                      <td className={VAL_CELL}>{listing.mode}</td>
                    </tr>
                  )}
                  <tr>
                    <td className={KEY_CELL}>Reserve Price</td>
                    <td className={VAL_CELL}>{formatINR(listing.reservePrice)}</td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>EMD Amount</td>
                    <td className={VAL_CELL}>{formatINR(listing.emdAmount)}</td>
                  </tr>
                  {listing.bidIncreaseAmount != null && (
                    <tr>
                      <td className={KEY_CELL}>Bid Increase Amount</td>
                      <td className={VAL_CELL}>{formatINR(listing.bidIncreaseAmount)}</td>
                    </tr>
                  )}
                  {listing.totalOutstandingDues != null && (
                    <tr>
                      <td className={KEY_CELL}>Total Outstanding Dues</td>
                      <td className={VAL_CELL}>{formatINR(listing.totalOutstandingDues)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspection */}
          <div className={PANEL}>
            <PanelHeader title="Inspection" source={`Source: ${listing.lender.name} sale notice`} />
            {inspection.decision.visible ? (
              <table className="w-full">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className={KEY_CELL}>Date &amp; Time</td>
                    <td className={VAL_CELL}>{inspection.value?.inspectionDatetime ? formatDateLong(inspection.value.inspectionDatetime) : "To be announced"}</td>
                  </tr>
                  {inspection.value?.inspectionNotes && (
                    <tr>
                      <td className={KEY_CELL}>Notes</td>
                      <td className={VAL_CELL}>{inspection.value.inspectionNotes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-8 text-center">
                <Lock className="mx-auto mb-3 h-6 w-6 text-ink2" />
                <p className="mb-4 text-sm text-ink2">Inspection date &amp; time are available after unlocking.</p>
                <UnlockCta listingId={listing.id} group="inspection" decision={inspection.decision} label="Inspection date & time" />
              </div>
            )}
          </div>

          {/* Officer / Lender Contact */}
          <div className={PANEL}>
            <PanelHeader title="Authorised Officer & Lender Contact" source={`Source: ${listing.lender.name} sale notice`} />
            {officerContact.decision.visible ? (
              <table className="w-full">
                <tbody className="divide-y divide-line">
                  {officerContact.value?.authorisedOfficerName && (
                    <tr><td className={KEY_CELL}>Officer</td><td className={VAL_CELL}>{officerContact.value.authorisedOfficerName}</td></tr>
                  )}
                  {officerContact.value?.authorisedOfficerPhone && (
                    <tr><td className={KEY_CELL}>Phone</td><td className={VAL_CELL}>{officerContact.value.authorisedOfficerPhone}</td></tr>
                  )}
                  {officerContact.value?.authorisedOfficerEmail && (
                    <tr><td className={KEY_CELL}>Email</td><td className={VAL_CELL}>{officerContact.value.authorisedOfficerEmail}</td></tr>
                  )}
                  {officerContact.value?.bankContact && (
                    <tr><td className={KEY_CELL}>Lender Contact</td><td className={VAL_CELL}>{officerContact.value.bankContact}</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-8 text-center">
                <Lock className="mx-auto mb-3 h-6 w-6 text-ink2" />
                <p className="mb-4 text-sm text-ink2">The bank's authorised officer contact is available after unlocking.</p>
                <UnlockCta listingId={listing.id} group="officer_contact" decision={officerContact.decision} label="Authorised officer & bank contact" />
              </div>
            )}
          </div>

          {/* Legal Status */}
          <div className={PANEL}>
            <PanelHeader title="Legal Status" source="Source: SARFAESI Act 2002" />
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className={KEY_CELL}>Sale Under</td>
                    <td className={VAL_CELL}>SARFAESI Act 2002 (Rule 6(2) &amp; 8(6))</td>
                  </tr>
                  <tr>
                    <td className={KEY_CELL}>Sale Basis</td>
                    <td className={VAL_CELL}>&ldquo;As is where is&rdquo;, &ldquo;As is what is&rdquo;, &ldquo;Whatever there is&rdquo;</td>
                  </tr>
                  <tr className="bg-brand-soft">
                    <td className="w-[42%] px-5 py-3 align-top text-sm font-semibold text-ink">Our Recommendation</td>
                    <td className="px-5 py-3 align-top text-sm font-bold text-brand">Book Due Diligence before bidding</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-block border border-gold-line bg-gold-soft p-5">
            <div className="mb-2 text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-gold">Important</div>
            <p className="text-sm leading-[1.65] text-ink">
              This property is sold on an <strong>&ldquo;As is where is&rdquo;, &ldquo;As is what is&rdquo;</strong> and <strong>&ldquo;Whatever there is&rdquo;</strong> basis. Intending bidders should make their own independent enquiries and verify the property, title, encumbrances, dues and statutory charges before bidding. Source: {listing.lender.name} E-Auction Sale Notice.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (Bid panel) */}
        <div className="w-full min-w-[280px] flex-[1_1_300px] lg:max-w-[360px]">
          <div className="rounded-panel border border-line bg-paper p-6 shadow-sticky lg:sticky lg:top-[60px]">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">Reserve Price</span>
            <div className="font-serif text-[32px] font-semibold leading-none tracking-[-0.02em] text-ink">
              {formatINR(listing.reservePrice)}
            </div>
            {perSqft && <div className="mt-1.5 text-sm text-ink2">{perSqft}</div>}

            <div className="mt-4 border-t border-line pt-3 text-sm text-ink2">
              EMD Required: <strong className="font-bold tabular-nums text-ink">{formatINR(listing.emdAmount)}</strong>
            </div>
            {listing.bidIncreaseAmount != null && (
              <div className="mb-3 text-xs text-ink2">Bid Increase Amount: {formatINR(listing.bidIncreaseAmount)}</div>
            )}

            <div className="mt-3 rounded-[14px] bg-brand-soft p-3.5">
              <div className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-brand">Auction</div>
              <strong className="block text-[15.5px] font-bold text-ink">{formatDateLong(listing.auctionDate)}</strong>
              <span className="text-xs text-ink2">{[listing.auctionTime, listing.mode].filter(Boolean).join(" · ")}</span>
            </div>

            {inspection.decision.visible && inspection.value?.inspectionDatetime && (
              <div className="mt-2.5 rounded-[14px] bg-surface p-3.5">
                <div className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-ink2">Inspection</div>
                <strong className="block text-[15.5px] font-bold text-ink">{formatDateLong(inspection.value.inspectionDatetime)}</strong>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <Link href="/services" className="flex h-12 items-center justify-center rounded-pill bg-brand text-[14.5px] font-bold text-on-brand transition-opacity hover:opacity-90">
                Hire Boliwala to Bid
              </Link>
              <button className="flex h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-paper">
                <MessageSquare className="h-4 w-4" /> WhatsApp Us Now
              </button>
              <Link href={`/contact?listing=${listing.slug}`} className="flex h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-paper">
                <Phone className="h-4 w-4" /> Request a Callback
              </Link>
              {listing.noticeUrl && (
                <a href={listing.noticeUrl} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-pill border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-paper">
                  <FileText className="h-4 w-4" /> Download Auction Notice (PDF)
                </a>
              )}
            </div>

            <div className="mt-5 rounded-block bg-surface p-5">
              <div className="mb-3 text-sm font-bold text-ink">Complete End-to-End Package</div>
              <div className="mb-2 flex flex-wrap items-baseline gap-2">
                <span className="font-serif text-[26px] font-semibold tracking-[-0.02em] text-brand">{formatINR(settings.servicePackagePrice)}</span>
                <span className="text-sm font-semibold text-ink2">+</span>
                <span className="font-serif text-lg font-semibold text-gold">{settings.successFeePct}%</span>
                <span className="text-sm font-semibold text-ink2">success fee</span>
              </div>
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-pill bg-pos-soft px-2.5 py-1 text-[11px] font-bold text-pos">
                ✓ {settings.successFeePct}% charged only if you win
              </div>
              <ul className="space-y-1.5">
                {["Due Diligence & Legal Search", "Auction Bid Management", "Possession Support", "Loan & Funding Assistance"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-ink2">
                    <span className="font-bold text-pos">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/services" className="mt-4 flex h-12 items-center justify-center rounded-pill bg-ink text-[14.5px] font-bold text-paper transition-opacity hover:opacity-90">
              Get Started — {formatINR(settings.servicePackagePrice)}
            </Link>

            <div className="mt-4 rounded-block bg-pos-soft p-3 text-xs font-medium text-pos">
              All property details are free on Boliwala — no paywall, no hidden address.
            </div>

            <div className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-ink2">
              <strong className="text-ink">Everything included.</strong> One flat fee of {formatINR(settings.servicePackagePrice)} engages our full team, plus a {settings.successFeePct}% success fee on the winning bid — charged only if you win.
            </div>
          </div>
        </div>
      </div>

      {/* SIMILAR AUCTIONS */}
      {similar.length > 0 && (
        <div className="mt-14 border-t border-line pt-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Same City</span>
              <h2 className="font-serif text-[32px] font-semibold tracking-[-0.02em] text-ink">Other Auctions in {listing.city}</h2>
            </div>
            <Link href={`/search?location=${encodeURIComponent(listing.city)}`} className="text-sm font-bold text-brand hover:underline">
              View all {listing.city} auctions →
            </Link>
          </div>

          <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {similar.map((s) => (
              <article key={s.id} className="relative flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-card transition-shadow hover:shadow-panel">
                <PhotoSlot label="Property photo" ratio="16 / 10">
                  <span className="absolute left-3 top-3 rounded-pill bg-[rgba(24,20,16,0.78)] px-[11px] py-[5px] text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-white backdrop-blur-[6px]">
                    {s.lender.shortName}
                  </span>
                </PhotoSlot>
                <div className="px-[18px] pb-4 pt-4">
                  <div className="font-serif text-[27px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">{formatINR(s.reservePrice)}</div>
                  <div className="mb-2.5 text-xs text-ink2">Reserve price</div>
                  <h3 className="mb-[3px] text-[15.5px] font-semibold leading-[1.35] text-ink">
                    <Link href={`/listing/${s.slug}`} className="after:absolute after:inset-0 after:content-['']">{s.title}</Link>
                  </h3>
                  <div className="text-[13.5px] text-ink2">{s.locality}, {s.city}</div>
                </div>
                <div className="mt-auto grid grid-cols-2 border-t border-line">
                  <div className="border-r border-line px-[18px] py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">Auction</div>
                    <div className="text-sm font-bold tabular-nums text-ink">{formatDateShort(s.auctionDate)}</div>
                  </div>
                  <div className="px-[18px] py-3">
                    <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink2">EMD</div>
                    <div className="text-sm font-bold tabular-nums text-ink">{formatINR(s.emdAmount)}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
