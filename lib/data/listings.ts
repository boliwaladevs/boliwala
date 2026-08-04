import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Bank, Listing, PossessionType, PropertyType } from "@/lib/data/types"

export const PAGE_SIZE = 12

export interface SearchFilters {
  q?: string
  location?: string
  propertyType?: PropertyType
  possession?: PossessionType
  bankIds: string[]
  minPrice?: number
  maxPrice?: number
  auctionWindow?: "week" | "month"
  sort: "auction_asc" | "price_asc" | "price_desc" | "recent"
  page: number
}

export type SearchParamsInput = Record<string, string | string[] | undefined>

const PROPERTY_TYPES: PropertyType[] = ["residential", "commercial", "industrial", "agricultural", "mixed_use"]
const POSSESSION_TYPES: PossessionType[] = ["physical", "symbolic"]

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function all(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

export function parseSearchFilters(searchParams: SearchParamsInput): SearchFilters {
  const propertyType = first(searchParams.propertyType)
  const possession = first(searchParams.possession)
  const auctionWindow = first(searchParams.auctionWindow)
  const sort = first(searchParams.sort)
  const page = Number(first(searchParams.page))
  const minPrice = Number(first(searchParams.minPrice))
  const maxPrice = Number(first(searchParams.maxPrice))

  return {
    q: first(searchParams.q)?.trim() || undefined,
    location: first(searchParams.location)?.trim() || undefined,
    propertyType: PROPERTY_TYPES.includes(propertyType as PropertyType) ? (propertyType as PropertyType) : undefined,
    possession: POSSESSION_TYPES.includes(possession as PossessionType) ? (possession as PossessionType) : undefined,
    bankIds: all(searchParams.bank),
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    auctionWindow: auctionWindow === "week" || auctionWindow === "month" ? auctionWindow : undefined,
    sort: sort === "price_asc" || sort === "price_desc" || sort === "recent" ? sort : "auction_asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

/** Strips characters that are syntactically significant in a PostgREST or=() filter string. */
function sanitizeForFilter(text: string): string {
  return text.replace(/[,()%*]/g, " ").trim()
}

const SEARCH_CARD_COLUMNS = `
  id, slug, title, "propertyType", "possessionType", status,
  "addressLine", locality, city, state, "reservePrice", "emdAmount",
  "auctionDate", "areaSqft", "bedrooms", "viewCount",
  bank:banks(id, name, "shortName", "logoUrl"),
  images:listing_images(url)
`

export interface SearchListing {
  id: string
  slug: string
  title: string
  propertyType: PropertyType
  possessionType: PossessionType
  status: string
  addressLine: string
  locality: string
  city: string
  state: string
  reservePrice: number
  emdAmount: number
  auctionDate: string
  areaSqft: number | null
  bedrooms: number | null
  viewCount: number
  bank: Bank
  images: { url: string }[]
}

/** Applies every filter except the bank filter — reused so the bank sidebar can show counts narrowed by the other active filters, without a bank selection narrowing its own counts to zero. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyNonBankFilters(query: any, filters: SearchFilters) {
  query = query.eq("status", "live")

  if (filters.location) {
    const text = sanitizeForFilter(filters.location)
    if (text) query = query.or(`city.ilike.%${text}%,locality.ilike.%${text}%,state.ilike.%${text}%`)
  }
  if (filters.q) {
    const text = sanitizeForFilter(filters.q)
    if (text) query = query.or(`title.ilike.%${text}%,addressLine.ilike.%${text}%`)
  }
  if (filters.propertyType) query = query.eq("propertyType", filters.propertyType)
  if (filters.possession) query = query.eq("possessionType", filters.possession)
  if (filters.minPrice !== undefined) query = query.gte("reservePrice", filters.minPrice)
  if (filters.maxPrice !== undefined) query = query.lte("reservePrice", filters.maxPrice)
  if (filters.auctionWindow) {
    const now = new Date()
    const days = filters.auctionWindow === "week" ? 7 : 30
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    query = query.gte("auctionDate", now.toISOString()).lte("auctionDate", end.toISOString())
  }

  return query
}

export async function searchListings(
  filters: SearchFilters,
): Promise<{ listings: SearchListing[]; totalCount: number }> {
  const supabase = await createClient()

  let query = supabase.from("listings").select(SEARCH_CARD_COLUMNS, { count: "exact" })
  query = applyNonBankFilters(query, filters)
  if (filters.bankIds.length > 0) query = query.in("bankId", filters.bankIds)

  switch (filters.sort) {
    case "price_asc":
      query = query.order("reservePrice", { ascending: true })
      break
    case "price_desc":
      query = query.order("reservePrice", { ascending: false })
      break
    case "recent":
      query = query.order("createdAt", { ascending: false })
      break
    default:
      query = query.order("auctionDate", { ascending: true })
  }

  const from = (filters.page - 1) * PAGE_SIZE
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1)
  if (error) throw error

  return { listings: (data ?? []) as unknown as SearchListing[], totalCount: count ?? 0 }
}

export interface BankWithCount extends Bank {
  count: number
}

/** Real bank list + live listing counts narrowed by every active filter except bank itself. */
export async function getBanksWithCounts(filters: SearchFilters): Promise<BankWithCount[]> {
  const supabase = await createClient()

  const { data: banks, error: banksError } = await supabase
    .from("banks")
    .select("id, name, shortName, logoUrl")
    .eq("isActive", true)
    .order("name")
  if (banksError) throw banksError

  let countQuery = supabase.from("listings").select("bankId")
  countQuery = applyNonBankFilters(countQuery, filters)
  const { data: rows, error: countError } = await countQuery
  if (countError) throw countError

  const counts = new Map<string, number>()
  for (const row of rows ?? []) {
    counts.set(row.bankId, (counts.get(row.bankId) ?? 0) + 1)
  }

  return (banks ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    logoUrl: b.logoUrl,
    count: counts.get(b.id) ?? 0,
  }))
}

const FULL_LISTING_COLUMNS = `
  id, slug, title, "propertyType", "possessionType", status,
  bank:banks(id, name, "shortName", "logoUrl"),
  "addressLine", locality, city, state, pincode,
  "reservePrice", "emdAmount", "estimatedMarketValue",
  "auctionDate", "auctionTime", mode, "emdDeadline", "bidIncreaseAmount", "totalOutstandingDues",
  "noticeUrl", "areaSqft", bedrooms, "viewCount",
  "flatNumber", floor, "inspectionDatetime", "inspectionNotes",
  "authorisedOfficerName", "authorisedOfficerPhone", "authorisedOfficerEmail", "bankContact",
  images:listing_images(url)
`

/**
 * Full-column fetch, gated fields included — safe only because this is
 * server-only and the caller must run it through resolveListingAccess() /
 * redactListing() before anything reaches a client component. Never pass
 * this return value directly to a client component.
 *
 * Uses the admin client deliberately: the gated columns have no SELECT
 * grant for anon/authenticated at all (by design — the DB itself blocks a
 * direct client read), so even a server-side call using the visitor's own
 * session can't read them. Reading the full row to compute the redaction is
 * a legitimate system operation, same category as the unlock RPC.
 */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("listings")
    .select(FULL_LISTING_COLUMNS)
    .eq("slug", slug)
    .eq("status", "live")
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as Omit<Listing, "images"> & { images: { url: string }[] }
  return { ...row, images: row.images.map((i) => i.url) }
}

/** A signed-in user's shortlisted listings, most recently saved first. */
export async function getShortlistedListings(userId: string): Promise<SearchListing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shortlists")
    .select(`listing:listings(${SEARCH_CARD_COLUMNS})`)
    .eq("userId", userId)
    .order("createdAt", { ascending: false })

  if (error) throw error
  return ((data ?? []) as unknown as { listing: SearchListing }[]).map((r) => r.listing).filter(Boolean)
}

/** A few other live listings in the same city, for the "Similar Auctions" section. */
export async function getSimilarListings(currentListingId: string, city: string, limit = 3): Promise<SearchListing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .select(SEARCH_CARD_COLUMNS)
    .eq("status", "live")
    .eq("city", city)
    .neq("id", currentListingId)
    .order("auctionDate", { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as unknown as SearchListing[]
}
