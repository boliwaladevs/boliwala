"use server"

import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"

export type SalesEnquiryPlan = "annual_subscription" | "service_package"

export interface ContactSalesInput {
  name: string
  phone: string
  email?: string
  plan: SalesEnquiryPlan
  message?: string
}

/**
 * Records a "Contact Sales" enquiry.
 *
 * Shaped deliberately like `submitCallbackRequest` in ./callback.ts — same
 * validation, same `{ ok }` return, same anon-insert RLS path — because it is
 * the same kind of operation and there is no reason for a second idiom.
 *
 * **The enquiry lands in the database and nowhere else.** `RESEND_API_KEY` is
 * empty and there is no email code in this repo, so nothing notifies anyone on
 * submit; an admin sees it in the panel's Sales Enquiries section. The success
 * copy the caller shows must not promise more than that, and the admin sidebar
 * badge is what makes it visible. Adding email is a scoped decision for the
 * client, not an assumption to build on (immediate_plan.md W2).
 */
export async function submitSalesEnquiry(
  input: ContactSalesInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.name.trim() || !input.phone.trim()) {
    return { ok: false, error: "Name and phone are required" }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("contact_sales_enquiries").insert({
    id: randomUUID(),
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    plan: input.plan,
    message: input.message?.trim() || null,
  })

  if (error) return { ok: false, error: "Couldn't submit your enquiry" }
  return { ok: true }
}
