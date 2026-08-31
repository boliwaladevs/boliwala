import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

import {
  DENIED_PARAM,
  DOOR_COOKIE,
  doorFromCookie,
  landingPathForRole,
  loginPathForDoor,
  roleAllowedAtDoor,
} from "@/lib/auth/landing"
import { NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-param"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Staff land on the admin panel rather than a customer profile page.
      // On a first Google sign-in the profile row is created by the
      // handle_new_user trigger during the exchange above, so the role is
      // already set (including superadmin, via the settings allowlist).
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single()

      // One email, one role: the door the sign-in started at admits only its
      // own roles, exactly as the password form enforces it. Same rule, same
      // file — lib/auth/landing.ts — called from both sides.
      const door = doorFromCookie(request.cookies.get(DOOR_COOKIE)?.value)

      if (!roleAllowedAtDoor(door, profile?.role)) {
        // Sign the session back out before bouncing. The code has already been
        // exchanged at this point, so without this the visitor keeps a valid
        // session while being shown a refusal.
        await supabase.auth.signOut()

        const denied = NextResponse.redirect(
          `${origin}${loginPathForDoor(door)}?${DENIED_PARAM}=1`,
        )
        denied.cookies.delete(NEXT_COOKIE)
        denied.cookies.delete(DOOR_COOKIE)
        return denied
      }

      // Where the user was headed before the Google round trip, if anywhere.
      // Re-validated here rather than trusted: the cookie is attacker-writable
      // in the same way the query parameter is.
      const raw = request.cookies.get(NEXT_COOKIE)?.value
      const next = safeNextPath(raw ? decodeURIComponent(raw) : null)

      const response = NextResponse.redirect(`${origin}${next ?? landingPathForRole(profile?.role)}`)
      response.cookies.delete(NEXT_COOKIE)
      response.cookies.delete(DOOR_COOKIE)
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
