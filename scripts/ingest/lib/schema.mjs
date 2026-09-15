// The extraction contract: what we ask Claude to pull out of a sale notice, and
// the rules it must follow while doing it.
//
// This is the highest-leverage file in the pipeline. Everything downstream
// trusts what comes out of here, and the one failure mode that matters is a
// confidently wrong number — a hallucinated reserve price reaches a buyer who
// acts on it. Every rule in the prompt below exists to make "I don't know"
// cheaper for the model than a guess.

import { z } from "zod"

/** Kept in step with the "PropertyType" enum in the database. */
export const PROPERTY_TYPES = ["residential", "commercial", "industrial", "agricultural", "mixed_use"]

/**
 * Asset classes we reject. MEMORY.md §D.2 descopes vehicles and plant &
 * machinery, and bank auction portals list a great many of both — an unfiltered
 * harvest of a district is roughly a third cars, trucks and factory equipment.
 * The model classifies; `3-normalize.mjs` drops.
 */
export const REJECTED_ASSET_CLASSES = ["vehicle", "plant_machinery", "gold", "shares", "other"]

const confidence = z.number().min(0).max(1)

export const NoticeSchema = z.object({
  // --- classification, read first by the rejection filter -------------------
  assetClass: z.enum([...PROPERTY_TYPES, ...REJECTED_ASSET_CLASSES]),
  assetClassReason: z.string(),

  // --- identity ------------------------------------------------------------
  title: z.string().nullable(),
  lenderName: z.string().nullable(),
  lenderType: z.enum(["bank", "nbfc", "arc", "hfc"]).nullable(),
  branchName: z.string().nullable(),
  noticeRef: z.string().nullable(),
  saleUnder: z.enum(["sarfaesi", "drt", "ibc_liquidation", "income_tax", "other"]).nullable(),

  // --- location ------------------------------------------------------------
  addressLine: z.string().nullable(),
  locality: z.string().nullable(),
  city: z.string().nullable(),
  district: z.string().nullable(),
  state: z.string().nullable(),
  pincode: z.string().nullable(),

  // --- the property --------------------------------------------------------
  possessionType: z.enum(["physical", "symbolic"]).nullable(),
  areaSqft: z.number().nullable(),
  areaBasis: z.enum(["carpet", "built_up", "super_built_up", "plot", "unknown"]).nullable(),
  bedrooms: z.number().int().nullable(),

  // --- money, all plain rupees --------------------------------------------
  reservePrice: z.number().nullable(),
  emdAmount: z.number().nullable(),
  bidIncreaseAmount: z.number().nullable(),
  totalOutstandingDues: z.number().nullable(),

  // --- dates, all ISO ------------------------------------------------------
  auctionDate: z.string().nullable(),
  auctionTime: z.string().nullable(),
  emdDeadline: z.string().nullable(),
  inspectionDatetime: z.string().nullable(),
  mode: z.string().nullable(),

  // --- contact (gated columns in the database) ------------------------------
  authorisedOfficerName: z.string().nullable(),
  authorisedOfficerPhone: z.string().nullable(),
  authorisedOfficerEmail: z.string().nullable(),

  // --- self-assessment -----------------------------------------------------
  // Only the fields that gate publishing. A per-field score on all 30 would be
  // mostly noise and would cost output tokens on every single notice.
  confidence: z.object({
    lenderName: confidence,
    addressLine: confidence,
    reservePrice: confidence,
    emdAmount: confidence,
    auctionDate: confidence,
    emdDeadline: confidence,
  }),

  // The verbatim substring each number was read from, so a human can check the
  // extraction against the source without opening the PDF. This is what makes
  // the QC pass fast enough to actually happen.
  quotes: z.object({
    reservePrice: z.string().nullable(),
    emdAmount: z.string().nullable(),
    areaSqft: z.string().nullable(),
    auctionDate: z.string().nullable(),
  }),
})

export const SYSTEM_PROMPT = `You extract structured data from Indian bank auction sale notices (SARFAESI Act, DRT recovery, and IBC liquidation notices) published in Maharashtra.

## The one rule that matters

Return null for anything the notice does not clearly state. A null costs nothing — it sends the record to a human reviewer. A guessed number is published to buyers who make financial decisions on it, and nobody catches it. Never infer, never average, never carry a number over from a similar field. If the notice is ambiguous, null plus a low confidence score is the correct answer.

Do not use knowledge from outside the notice text. If the notice does not name the district, do not deduce it from the locality — return null and let the geocoder handle it.

## Money

Return plain rupees as a number: no symbols, no separators, no decimals unless the notice gives paise.
- "Rs. 35,11,200/-" -> 3511200
- "₹ 52.50 Lakhs" -> 5250000   (1 lakh = 100,000)
- "Rs. 2.4 Crore" -> 24000000  (1 crore = 10,000,000)
- Words ("Rupees Thirty Five Lakh Eleven Thousand Two Hundred Only") -> 3511200

Reserve price is the minimum bid, sometimes called "Reserve Price", "RP", or "upset price". EMD is the earnest money deposit, usually 10% of the reserve price — but extract the stated figure, never compute it. If only a percentage is given and not an amount, return null for emdAmount.

## Dates

Return ISO 8601: YYYY-MM-DD, or YYYY-MM-DDTHH:MM:SS when a time is given.

**Indian notices are DD/MM/YYYY.** "09/03/2026" is 9 March 2026, not 9 September. "15/09/2026" is 15 September 2026. Getting this backwards silently sets the wrong auction date on half the corpus, so read the day first every time. If a date is genuinely ambiguous and unresolvable, return null.

auctionDate is when bidding happens. emdDeadline is the last date to submit the EMD and KYC — usually a few days before. They are different dates; do not copy one into the other.

## Area

Return square feet as a number.
- Square metres -> multiply by 10.7639 ("67.36 sq.mtrs" -> 725)
- Guntha, acre, hectare: convert (1 guntha = 1089 sq.ft, 1 acre = 43560 sq.ft, 1 hectare = 107639 sq.ft)

Set areaBasis to which measure it is. Prefer carpet area when several are given. If the notice gives only a plot dimension for a flat, return null.

## Possession

"physical" when the notice says physical possession has been taken. "symbolic" when it says symbolic or constructive possession. This is the field serious buyers filter on — a symbolic-possession property may still be occupied by the borrower — so do not guess. If the notice does not say, return null.

## Asset class

Classify what is being sold. Use residential, commercial, industrial, agricultural or mixed_use for real property. Use vehicle, plant_machinery, gold, shares or other for anything that is not land or a building — these are dropped downstream, so classify them honestly rather than forcing them into a property type. A notice selling a factory building is industrial; a notice selling the machines inside it is plant_machinery. Put your reasoning in assetClassReason in one short sentence.

## Borrower details

Do not extract borrower or guarantor names even when the notice prints them. They are not wanted in this dataset.

## Confidence and quotes

Score each listed field 0 to 1: how sure are you that this value is correct and unambiguous in this notice? Be honest — a low score routes the record to a human, which is the system working. Do not score a field 0.9 because the notice is well formatted; score what you actually read.

For quotes, copy the exact substring you read the number from, verbatim, including the currency symbol and separators as printed. If the value is null, the quote is null.`

/**
 * The per-notice user message.
 *
 * The full notice text, never a regex-trimmed fragment: notices bury carpet
 * area inside a schedule paragraph and possession type in a footnote, and a
 * pre-trimmed extract reliably loses exactly those fields.
 */
export function buildUserMessage({ text, sourcePortal, sourceHint }) {
  return `Source portal: ${sourcePortal}${sourceHint ? `\nFile: ${sourceHint}` : ""}

Extract the auction listing from this sale notice.

--- NOTICE TEXT BEGINS ---
${text}
--- NOTICE TEXT ENDS ---`
}
