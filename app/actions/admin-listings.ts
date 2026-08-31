"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminListings, getListingForEdit, type AdminEditableListing, type AdminListingFilters, type AdminListingRow } from "@/lib/data/admin"
import type { ListingStatus, PossessionType, PropertyType } from "@/lib/data/types"

export async function searchAdminListingsAction(filters: AdminListingFilters): Promise<AdminListingRow[]> {
  await requireAdmin()
  return getAdminListings(filters)
}

export async function getListingForEditAction(id: string): Promise<AdminEditableListing | null> {
  await requireAdmin()
  return getListingForEdit(id)
}

export interface ListingInput {
  title: string
  propertyType: PropertyType
  possessionType: PossessionType
  status: ListingStatus
  lenderId: string
  addressLine: string
  locality: string
  city: string
  state: string
  pincode: string
  reservePrice: number
  emdAmount: number
  estimatedMarketValue: number | null
  auctionDate: string
  auctionTime: string | null
  mode: string | null
  emdDeadline: string
  bidIncreaseAmount: number | null
  totalOutstandingDues: number | null
  noticeUrl: string | null
  areaSqft: number | null
  bedrooms: number | null
  flatNumber: string | null
  floor: string | null
  inspectionDatetime: string | null
  inspectionNotes: string | null
  authorisedOfficerName: string | null
  authorisedOfficerPhone: string | null
  authorisedOfficerEmail: string | null
  bankContact: string | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function generateUniqueSlug(input: ListingInput): Promise<string> {
  const admin = createAdminClient()
  const { data: lender } = await admin.from("lenders").select("shortName").eq("id", input.lenderId).single()
  const base = slugify(`${input.title}-${input.city}-${lender?.shortName ?? ""}`)

  let slug = base
  let suffix = 1
  while (true) {
    const { data } = await admin.from("listings").select("id").eq("slug", slug).maybeSingle()
    if (!data) return slug
    suffix += 1
    slug = `${base}-${suffix}`
  }
}

export async function createListing(input: ListingInput): Promise<{ id: string; slug: string }> {
  await requireAdmin()
  const admin = createAdminClient()
  const slug = await generateUniqueSlug(input)
  const id = randomUUID()
  const now = new Date().toISOString()

  const { error } = await admin.from("listings").insert({
    id,
    slug,
    ...input,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  })
  if (error) throw error

  revalidatePath("/admin")
  return { id, slug }
}

export async function updateListing(id: string, input: ListingInput): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from("listings")
    .update({ ...input, updatedAt: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error

  revalidatePath("/admin")
  revalidatePath("/search")
  revalidatePath("/listing/[slug]", "page")
}

/** Soft delete — sets status to cancelled rather than removing the row, since
 * shortlists/unlocks/view history may already reference it. */
export async function cancelListing(id: string): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from("listings").update({ status: "cancelled", updatedAt: new Date().toISOString() }).eq("id", id)
  if (error) throw error
  revalidatePath("/admin")
  revalidatePath("/search")
}

export async function uploadListingImage(formData: FormData): Promise<{ id: string; url: string }> {
  await requireAdmin()
  const admin = createAdminClient()

  const listingId = formData.get("listingId") as string
  const file = formData.get("file") as File
  if (!listingId || !file) throw new Error("Missing listingId or file")

  const ext = file.name.split(".").pop() ?? "jpg"
  const path = `${listingId}/${randomUUID()}.${ext}`

  const { error: uploadError } = await admin.storage.from("listing-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: publicUrl } = admin.storage.from("listing-images").getPublicUrl(path)

  const { count } = await admin.from("listing_images").select("id", { count: "exact", head: true }).eq("listingId", listingId)
  const isPrimary = (count ?? 0) === 0

  const id = randomUUID()
  const { error: insertError } = await admin.from("listing_images").insert({
    id,
    listingId,
    url: publicUrl.publicUrl,
    sortOrder: count ?? 0,
    isPrimary,
  })
  if (insertError) throw insertError

  revalidatePath("/admin")
  revalidatePath("/listing/[slug]", "page")
  return { id, url: publicUrl.publicUrl }
}

export async function deleteListingImage(imageId: string): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()

  const { data: image } = await admin.from("listing_images").select("url").eq("id", imageId).single()
  if (image) {
    const path = new URL(image.url).pathname.split("/listing-images/")[1]
    if (path) await admin.storage.from("listing-images").remove([path])
  }

  const { error } = await admin.from("listing_images").delete().eq("id", imageId)
  if (error) throw error

  revalidatePath("/admin")
  revalidatePath("/listing/[slug]", "page")
}

export async function setPrimaryImage(listingId: string, imageId: string): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()

  await admin.from("listing_images").update({ isPrimary: false }).eq("listingId", listingId)
  const { error } = await admin.from("listing_images").update({ isPrimary: true }).eq("id", imageId)
  if (error) throw error

  revalidatePath("/admin")
  revalidatePath("/listing/[slug]", "page")
}

export interface BulkRow {
  rowNumber: number
  data: Partial<ListingInput>
  errors: string[]
}

export async function bulkCommitListings(rows: ListingInput[]): Promise<{ committed: number }> {
  await requireAdmin()
  const admin = createAdminClient()
  const now = new Date().toISOString()

  let committed = 0
  for (const input of rows) {
    const slug = await generateUniqueSlug(input)
    const { error } = await admin.from("listings").insert({
      id: randomUUID(),
      slug,
      ...input,
      status: "draft",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    if (!error) committed += 1
  }

  revalidatePath("/admin")
  return { committed }
}
