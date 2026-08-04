"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { FieldGroup } from "@/lib/access/types"

export async function unlockFieldGroup(
  listingId: string,
  fieldGroup: FieldGroup,
): Promise<{ ok: true; newBalance: number } | { ok: false; error: "not_authenticated" | "insufficient_credits" | "unknown" }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "not_authenticated" }

  const { data, error } = await supabase.rpc("unlock_field_group", {
    p_listing_id: listingId,
    p_field_group: fieldGroup,
  })

  if (error) {
    return { ok: false, error: error.message.includes("insufficient_credits") ? "insufficient_credits" : "unknown" }
  }

  revalidatePath("/listing/[slug]", "page")
  revalidatePath("/profile")
  return { ok: true, newBalance: (data as { newBalance: number }).newBalance }
}
