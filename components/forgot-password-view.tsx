"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

/**
 * Where a password reset is requested.
 *
 * Previously this was a button inside the login form, which meant it could not
 * be linked to — and the two places that most need to send someone here (the
 * Google/password collision notice, and a support conversation) had nowhere to
 * point. A route fixes that.
 */
export function ForgotPasswordView() {
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  // Read after mount rather than with useSearchParams(): this page is statically
  // prerendered, and useSearchParams() would force a Suspense boundary around
  // the form to keep that. Same pattern as the login form.
  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("email")
    if (prefill) setEmail(prefill)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (error) {
      toast({ variant: "destructive", title: "Couldn't send reset email", description: error.message })
      return
    }

    // The same confirmation whether or not the address has an account. Saying
    // "no such account" here would turn this page into a membership oracle for
    // anyone who cared to ask it, and the person who genuinely mistyped their
    // address finds out just as fast from an email that never arrives.
    setSent(true)
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

        {sent ? (
          <>
            <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {`If an account exists for ${email}, we've sent it a link to set a new password. The link expires in one hour.`}
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="w-full bg-background border border-border hover:bg-secondary/50 text-foreground font-semibold h-12 rounded-xl transition-colors text-sm"
            >
              Use a different email
            </button>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Reset your password</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email address and we'll send you a link to set a new one.
            </p>

            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
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

              <button
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold h-12 rounded-xl mt-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
