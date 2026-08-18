import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

import { landingPathForRole } from "@/lib/auth/landing"

export async function GET(request: Request) {
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

      return NextResponse.redirect(`${origin}${landingPathForRole(profile?.role)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
