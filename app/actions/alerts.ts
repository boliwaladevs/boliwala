"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { alertFiltersFromSearch } from "@/lib/alerts"

type SaveResult = { ok: true; duplicate: boolean } | { error: string }

/**
 * Saves the current search as an alert.
 *
 * Works signed out as well as signed in — the homepage alerts form has always
 * accepted an email from a guest, and requiring login here would lose exactly
 * the visitor most worth capturing. A guest row simply has a null userId.
 */
export async function saveSearchAlert(
  queryString: string,
  emailInput?: string,
  frequencyInput?: string,
): Promise<SaveResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const email = (emailInput ?? user?.email ?? "").trim().toLowerCase()
  if (!email) return { error: "Enter an email address so we know where to send alerts." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That doesn't look like a valid email address." }

  const filters = alertFiltersFromSearch(new URLSearchParams(queryString))
  const frequency = ["instant", "daily", "weekly"].includes(frequencyInput ?? "")
    ? (frequencyInput as string)
    : "instant"

  // Saving the same search twice is a mis-click, not an intent to be emailed
  // twice. Match on the filter object rather than the raw query string so
  // "?location=Pune&page=2" and "?location=Pune" count as the same alert.
  //
  // Read through the admin client: alert_subscriptions has no SELECT policy for
  // anon, so a guest's own duplicate check would come back empty and insert a
  // second row every time. Reading a row to decide whether to write one is the
  // same category of system operation as the unlock RPC.
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("alert_subscriptions")
    .select("id, isActive, userId")
    .eq("email", email)
    .eq("filters", JSON.stringify(filters))
    .maybeSingle()

  if (existing) {
    // Re-saving a switched-off alert is a request to switch it back on — but
    // only for its owner. A guest supplying someone else's address must not be
    // able to resurrect their alerts, so an unowned match just reports
    // "already saved" and changes nothing.
    const isOwner = !!user && existing.userId === user.id
    if (!existing.isActive && isOwner) {
      await supabase.from("alert_subscriptions").update({ isActive: true }).eq("id", existing.id)
      revalidatePath("/profile")
      return { ok: true, duplicate: false }
    }
    return { ok: true, duplicate: true }
  }

  const { error } = await supabase.from("alert_subscriptions").insert({
    id: randomUUID(),
    userId: user?.id ?? null,
    email,
    filters,
    frequency,
    isActive: true,
  })

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { ok: true, duplicate: false }
}

/**
 * Switches an alert off. Deactivates rather than deletes so the same search can
 * be re-enabled from the same row, and so there is a record of what someone
 * asked for.
 */
export async function setAlertActive(
  alertId: string,
  isActive: boolean,
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "not_authenticated" }

  // The userId filter is belt-and-braces next to RLS — an id from another
  // user's account matches no row rather than silently doing nothing.
  const { error } = await supabase
    .from("alert_subscriptions")
    .update({ isActive })
    .eq("id", alertId)
    .eq("userId", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { ok: true }
}

/**
 * Changes how often an alert is sent.
 *
 * Goes through the admin client rather than the caller's own session on
 * purpose. Migration 0010 deliberately narrowed the client-writable surface on
 * alert_subscriptions to `isActive` alone, so a direct PATCH of `frequency`
 * would be denied by RLS — and PostgREST reports that denial as a *successful*
 * call affecting zero rows, i.e. the picker would appear to work and silently
 * do nothing. That is the exact bug 0010's own header warns about.
 *
 * Ownership is verified here instead, before the write. Widening the RLS policy
 * would have been the alternative; this keeps the client-writable surface as
 * narrow as 0010 intended.
 */
export async function updateAlertFrequency(
  alertId: string,
  frequency: string,
): Promise<{ ok: true } | { error: string }> {
  if (!["instant", "daily", "weekly"].includes(frequency)) {
    return { error: "Pick instant, daily or weekly." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "not_authenticated" }

  const admin = createAdminClient()
  const { data: owned } = await admin
    .from("alert_subscriptions")
    .select("id")
    .eq("id", alertId)
    .eq("userId", user.id)
    .maybeSingle()

  if (!owned) return { error: "That alert doesn't exist, or isn't yours." }

  const { error } = await admin
    .from("alert_subscriptions")
    .update({ frequency })
    .eq("id", alertId)
    .eq("userId", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { ok: true }
}

/**
 * Deletes an alert outright.
 *
 * Same reasoning as updateAlertFrequency: there is no DELETE policy on
 * alert_subscriptions for any client role, so this runs as service-role after
 * an explicit ownership check. The `userId` filter is repeated on the delete
 * itself so a race between the check and the write cannot remove someone
 * else's row.
 *
 * Distinct from setAlertActive, which pauses. Pausing keeps a record of what
 * was asked for; deleting is for when the user wants it gone.
 */
export async function deleteAlert(alertId: string): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "not_authenticated" }

  const admin = createAdminClient()
  const { data: owned } = await admin
    .from("alert_subscriptions")
    .select("id")
    .eq("id", alertId)
    .eq("userId", user.id)
    .maybeSingle()

  if (!owned) return { error: "That alert doesn't exist, or isn't yours." }

  const { error } = await admin
    .from("alert_subscriptions")
    .delete()
    .eq("id", alertId)
    .eq("userId", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { ok: true }
}
