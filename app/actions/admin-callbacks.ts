"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCallbackRequests, type AdminCallbackRow, type CallbackFilters, type CallbackStatus } from "@/lib/data/admin"

export async function searchCallbackRequestsAction(filters: CallbackFilters): Promise<AdminCallbackRow[]> {
  await requireAdmin()
  return getCallbackRequests(filters)
}

export async function updateCallbackRequest(id: string, updates: { status?: CallbackStatus; notes?: string }): Promise<void> {
  const admin_ = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from("callback_requests")
    .update({ ...updates, assignedTo: admin_.userId })
    .eq("id", id)
  if (error) throw error

  revalidatePath("/admin")
}
