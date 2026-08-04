"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function toggleShortlist(
  listingId: string,
): Promise<{ shortlisted: boolean } | { error: "not_authenticated" }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "not_authenticated" }

  const { data: existing } = await supabase
    .from("shortlists")
    .select("id")
    .eq("userId", user.id)
    .eq("listingId", listingId)
    .maybeSingle()

  if (existing) {
    await supabase.from("shortlists").delete().eq("id", existing.id)
    revalidatePath("/search")
    revalidatePath("/profile")
    return { shortlisted: false }
  }

  await supabase.from("shortlists").insert({ id: randomUUID(), userId: user.id, listingId })
  revalidatePath("/search")
  revalidatePath("/profile")
  return { shortlisted: true }
}
