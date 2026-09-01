"use server"

import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCommissionSettings } from "@/lib/access/settings"

const REF_COOKIE = "bw_ref"

/**
 * Turns a captured referral cookie into a `partner_referrals` row, once, for the
 * account that has just been created.
 *
 * Called from both signup doors — the password form and the Google callback —
 * because a referral must survive whichever one the visitor uses.
 *
 * Written with the service-role client on purpose: the row belongs to the
 * *partner*, and the person signing up has no read or write access to it under
 * the RLS policies from 0018. They are the subject of the record, not its owner.
 *
 * Silent on every failure. A referral that cannot be attributed must never stop
 * somebody creating an account, and there is nothing the new user could do about
 * it anyway.
 */
export async function attributeReferral(): Promise<void> {
  const jar = await cookies()
  const raw = jar.get(REF_COOKIE)?.value
  if (!raw) return

  // Clear it either way: a code that failed to attribute now will not attribute
  // later, and leaving it behind would re-run this on every subsequent signup
  // from the same browser.
  jar.delete(REF_COOKIE)

  let code: string
  let landedAt: Date
  try {
    const parsed = JSON.parse(raw) as { code?: string; at?: string }
    if (!parsed.code || !parsed.at) return
    code = parsed.code
    landedAt = new Date(parsed.at)
    if (Number.isNaN(landedAt.getTime())) return
  } catch {
    return
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // The settings table is authoritative on the window, not the cookie's own
  // lifetime — so shortening it takes effect for cookies already issued.
  const { attributionDays } = await getCommissionSettings()
  const ageDays = (Date.now() - landedAt.getTime()) / 86_400_000
  if (ageDays > attributionDays) return

  const admin = createAdminClient()

  const { data: partner } = await admin
    .from("profiles")
    .select("id, role")
    .eq("referralCode", code)
    .maybeSingle()

  // Only a live channel partner earns. An approved partner who was later
  // demoted should not keep accruing on a link that is still circulating.
  if (!partner || partner.role !== "channel_partner") return

  // Nobody refers themselves.
  if (partner.id === user.id) return

  // `unique (referredProfileId)` in 0018 means a second attempt for the same
  // person is refused by the database rather than creating a rival claim.
  await admin.from("partner_referrals").insert({
    id: randomUUID(),
    partnerId: partner.id,
    refCode: code,
    referredProfileId: user.id,
    landedAt: landedAt.toISOString(),
  })
}
