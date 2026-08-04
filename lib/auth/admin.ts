import "server-only"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export interface AdminUser {
  userId: string
  fullName: string | null
  email: string
}

/**
 * Guards an admin page/action. Redirects signed-out visitors to /login and
 * non-admins to /, same as /profile's session guard. Uses the caller's own
 * session (not the service-role client) — this is the real authorization
 * check; admin data operations still go through the admin client for gated
 * columns, but only after this check passes.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role, fullName, email").eq("id", user.id).single()

  if (profile?.role !== "admin") redirect("/")

  return { userId: user.id, fullName: profile.fullName, email: profile.email }
}
