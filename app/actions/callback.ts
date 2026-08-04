"use server"

import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"

export interface CallbackRequestInput {
  name: string
  phone: string
  email?: string
  message?: string
  source: "listing" | "contact" | "services" | "homepage"
  listingId?: string
}

export async function submitCallbackRequest(input: CallbackRequestInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.name.trim() || !input.phone.trim()) {
    return { ok: false, error: "Name and phone are required" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("callback_requests").insert({
    id: randomUUID(),
    listingId: input.listingId ?? null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    message: input.message?.trim() || null,
    source: input.source,
  })

  if (error) return { ok: false, error: "Couldn't submit your request" }
  return { ok: true }
}
