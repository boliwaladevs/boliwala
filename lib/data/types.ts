export type PropertyType =
  | "residential"
  | "commercial"
  | "industrial"
  | "agricultural"
  | "mixed_use"

export type PossessionType = "physical" | "symbolic"

export type ListingStatus = "draft" | "live" | "closed" | "cancelled"

export interface Bank {
  id: string
  name: string
  shortName: string
  logoUrl: string | null
}

/** Shape of a row read with full column access (server-side, post-gating-check only). */
export interface Listing {
  id: string
  slug: string
  title: string
  propertyType: PropertyType
  possessionType: PossessionType
  status: ListingStatus
  bank: Bank

  addressLine: string
  locality: string
  city: string
  state: string
  pincode: string
  reservePrice: number
  emdAmount: number
  estimatedMarketValue: number | null
  auctionDate: string
  emdDeadline: string
  noticeUrl: string | null
  areaSqft: number | null
  bedrooms: number | null
  images: string[]
  viewCount: number

  flatNumber: string | null
  floor: string | null
  inspectionDatetime: string | null
  inspectionNotes: string | null
  authorisedOfficerName: string | null
  authorisedOfficerPhone: string | null
  authorisedOfficerEmail: string | null
  bankContact: string | null
}
