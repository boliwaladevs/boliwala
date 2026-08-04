"use server"

import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"

export interface PartnerApplicationInput {
  name: string
  phone: string
  email: string
  city: string
  state: string
  occupation?: string
  experience?: string
}

export async function submitPartnerApplication(input: PartnerApplicationInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.name.trim() || !input.phone.trim() || !input.email.trim() || !input.city.trim() || !input.state.trim()) {
    return { ok: false, error: "Name, phone, email, city and state are required" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("channel_partner_applications").insert({
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    occupation: input.occupation?.trim() || null,
    experience: input.experience?.trim() || null,
  })

  if (error) return { ok: false, error: "Couldn't submit your application" }
  return { ok: true }
}
