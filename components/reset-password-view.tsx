"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ResetPasswordView() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // null while the recovery token in the URL fragment is still being consumed.
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  /**
   * Confirm a recovery session actually exists before offering the form.
   *
   * Supabase's browser client picks the recovery token out of the URL fragment
   * asynchronously, so there is a window where getSession() is legitimately
   * empty on a perfectly good link — hence listening for the auth event as well
   * as reading the session, and only concluding "expired" once both have had
   * their turn. Without this the page rendered a live-looking form to anyone
   * who opened /reset-password directly, and only revealed the problem after
   * they had chosen and typed a new password.
   */
  useEffect(() => {
    let settled = false

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true
        setHasRecoverySession(true)
      }
    })

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true
        setHasRecoverySession(true)
      }
    })

    // The fragment is parsed on load; if nothing has arrived shortly after,
    // there was no usable token in the link.
    const timer = setTimeout(() => {
      if (!settled) setHasRecoverySession(false)
    }, 2000)

    return () => {
      clearTimeout(timer)
      subscription.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setSubmitting(false)
      toast({ variant: "destructive", title: "Couldn't update password", description: error.message })
      return
    }

    // Sign the recovery session out and send them through the front door.
    // Pushing to /profile — as this used to — is wrong for an admin or a
    // channel partner, and the login path is the one place that knows where a
    // role belongs (lib/auth/landing.ts). It also proves the new password
    // works, immediately, while they still remember what they typed.
    await supabase.auth.signOut()
    setSubmitting(false)
    router.push("/login?reset=1")
    router.refresh()
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="inline-flex items-center gap-2 group mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white shrink-0 font-display">B</div>
          <div className="text-xl font-extrabold text-foreground tracking-tight leading-none font-display">
            Boli<span className="text-blue-600">wala</span>
          </div>
        </Link>
        {children}
      </div>
    </div>
  )

  if (hasRecoverySession === null) {
    return shell(<p className="text-sm text-muted-foreground">Checking your reset link…</p>)
  }

  if (hasRecoverySession === false) {
    return shell(
      <>
        <h2 className="text-3xl font-bold text-foreground mb-2 font-display">This link has expired</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Password reset links can only be used once, and expire an hour after they're
          sent. Request a new one and we'll email it straight away.
        </p>
        <Link
          href="/forgot-password"
          className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5"
        >
          Request a new link
        </Link>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </p>
      </>,
    )
  }

  return shell(
    <>
      <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Set a new password</h2>
      <p className="text-sm text-muted-foreground mb-8">Enter a new password for your account.</p>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`h-12 w-full pl-4 pr-12 rounded-xl border border-border bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm ${showPassword ? "" : "tracking-widest"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold h-12 rounded-xl mt-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5">
          {submitting ? "Please wait…" : "Update Password"}
        </button>
      </form>
    </>,
  )
}
