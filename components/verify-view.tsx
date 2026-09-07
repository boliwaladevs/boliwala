"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { attributeReferral } from "@/app/actions/referral"

/**
 * Where a new email account is verified.
 *
 * The welcome email carries both a link here and a six-digit code, and the user
 * needs both: the link identifies which address is being verified, the code
 * proves they opened the mail. Supabase mints and expires the code — this only
 * presents it.
 */
export function VerifyView() {
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  // Read after mount rather than with useSearchParams(), for the same reason as
  // the login form: this page is statically prerendered, and useSearchParams()
  // would force a Suspense boundary around the whole form to keep that.
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("email")
    if (fromLink) setEmail(fromLink)
  }, [])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // "signup" is the type that pairs with Supabase's "Confirm signup" template
    // and with the resend({ type: "signup" }) calls elsewhere. "email" is the
    // separate sign-in-with-OTP flow and would reject this token.
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "signup",
    })

    if (error) {
      setSubmitting(false)
      toast({ variant: "destructive", title: "Couldn't verify", description: error.message })
      return
    }

    // verifyOtp mints a session, and this is the first moment in the email
    // signup flow where one exists — signUp no longer returns one now that
    // confirmation is required. The referral cookie is httpOnly, so only the
    // server can read it, and it needs a session to know who was referred.
    // Attribute it here or the partner never gets paid.
    await attributeReferral()

    // Then drop the session deliberately. The user re-enters through the normal
    // login path, which is what decides where their role lands them — see
    // lib/auth/landing.ts. Verification proves an address; it is not a sign-in.
    await supabase.auth.signOut()

    setSubmitting(false)
    router.push("/login?verified=1")
    router.refresh()
  }

  const handleResend = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Enter your email first",
        description: "Type the address you signed up with, then resend.",
      })
      return
    }
    setResending(true)
    const { error } = await supabase.auth.resend({ type: "signup", email })
    setResending(false)
    if (error) {
      toast({ variant: "destructive", title: "Couldn't resend", description: error.message })
      return
    }
    toast({ title: "Verification email sent", description: `Check the inbox for ${email}.` })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-flex items-center gap-2 group mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white shrink-0 font-display">B</div>
          <div className="text-xl font-extrabold text-foreground tracking-tight leading-none font-display">
            Boli<span className="text-blue-600">wala</span>
          </div>
        </Link>

        <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Verify your email</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Enter the 6-digit code from your welcome email to activate your account.
        </p>

        <form className="flex flex-col gap-5" onSubmit={handleVerify}>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 px-4 rounded-xl border border-border bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Verification Code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={token}
              // Digits only, six of them: pasting the code out of an email
              // routinely brings a space or a stray character with it.
              onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              minLength={6}
              maxLength={6}
              className="h-14 px-4 rounded-xl border border-border bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-2xl font-bold text-center tracking-[0.5em]"
            />
          </div>

          <button
            disabled={submitting || token.length !== 6}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold h-12 rounded-xl mt-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
          >
            {submitting ? "Verifying…" : "Verify my email"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Didn't get the email?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-bold text-blue-600 hover:text-blue-700 disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend it"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground mt-2">
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
