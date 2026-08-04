"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ResetPasswordView() {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update password", description: error.message })
      return
    }
    toast({ title: "Password updated", description: "You can now log in with your new password." })
    router.push("/profile")
    router.refresh()
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

        <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Set a new password</h2>
        <p className="text-sm text-muted-foreground mb-8">Enter a new password for your account.</p>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 px-4 rounded-xl border border-border bg-background focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-sm tracking-widest"
            />
          </div>

          <button disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold h-12 rounded-xl mt-2 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:-translate-y-0.5">
            {submitting ? "Please wait…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  )
}
