import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

import { postLoginPath } from "@/lib/auth/landing"
import { NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-param"
import { attributeReferral } from "@/app/actions/referral"
import { sendGoogleWelcomeEmail } from "@/lib/email/welcome"
import { CONFLICT_PARAM } from "@/lib/auth/conflict"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // One email, one provider. An account created with a password is entered
      // with that password — Google is not a second way in. Supabase links a
      // Google identity onto a matching verified email automatically, so by the
      // time we get here the link may already exist; the account is still a
      // password account, and the `email` identity is what says so.
      const identities = data.user.identities ?? []
      const passwordIdentity = identities.find((i) => i.provider === "email")

      if (passwordIdentity) {
        // Undo the link Supabase just made, so a second attempt behaves exactly
        // like the first and the account is left as it was found. Best effort:
        // this is hygiene, and failing it must not change the outcome below.
        const googleIdentity = identities.find((i) => i.provider === "google")
        if (googleIdentity) {
          try {
            await supabase.auth.unlinkIdentity(googleIdentity)
          } catch {
            // Nothing useful to do — the bounce below still stands.
          }
        }

        // Sign out before bouncing. The code has already been exchanged, so
        // without this the visitor keeps a valid session while being refused.
        await supabase.auth.signOut()

        const conflict = NextResponse.redirect(
          `${origin}/login?${CONFLICT_PARAM}=email`,
        )
        conflict.cookies.delete(NEXT_COOKIE)
        return conflict
      }

      // Staff land on the admin panel rather than a customer profile page.
      // On a first Google sign-in the profile row is created by the
      // handle_new_user trigger during the exchange above, so the role is
      // already set (including superadmin, via the settings allowlist).
      const { data: profile } = await supabase
        .from("profiles")
        .select('role, "welcomeEmailSentAt"')
        .eq("id", data.user.id)
        .single()

      // The welcome email Supabase cannot send: it mails on password signup to
      // confirm an address, and a Google account has no address to confirm.
      // `welcomeEmailSentAt` is the idempotency key — comparing the account's
      // created_at against now() would double-send on a slow round trip.
      if (profile && !profile.welcomeEmailSentAt && data.user.email) {
        const sent = await sendGoogleWelcomeEmail(data.user.email, data.user.user_metadata?.full_name ?? null)
        if (sent) {
          // Service-role: "welcomeEmailSentAt" is deliberately outside the
          // column grant that lets a signed-in user edit their own profile.
          await createAdminClient()
            .from("profiles")
            .update({ welcomeEmailSentAt: new Date().toISOString() })
            .eq("id", data.user.id)
        }
      }

      // Same referral attribution the verify page does. It runs on every
      // Google sign-in, not only the first: the insert is a no-op for an
      // account that already has a referral row (unique on referredProfileId),
      // and there is no cookie to act on unless one was captured.
      await attributeReferral()

      // Where the user was headed before the Google round trip, if anywhere.
      // Re-validated here rather than trusted: the cookie is attacker-writable
      // in the same way the query parameter is.
      const raw = request.cookies.get(NEXT_COOKIE)?.value
      const next = safeNextPath(raw ? decodeURIComponent(raw) : null)

      const response = NextResponse.redirect(`${origin}${postLoginPath(profile?.role, next)}`)
      response.cookies.delete(NEXT_COOKIE)
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
