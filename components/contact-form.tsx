"use client"

import { useState } from "react"
import { submitCallbackRequest } from "@/app/actions/callback"

export function ContactForm({
  source,
  listingId,
  listingTitle,
}: {
  source: "listing" | "contact" | "services"
  listingId?: string
  listingTitle?: string
}) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await submitCallbackRequest({ name, phone, email, message, source, listingId })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-8 text-center">
        <div className="text-3xl mb-3">✅</div>
        <h3 className="text-lg font-bold text-foreground mb-2">Request received</h3>
        <p className="text-sm text-muted-foreground">Our team will call you back within 24 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-background border border-border rounded-xl p-6 md:p-8 shadow-sm flex flex-col gap-5">
      {listingTitle && (
        <div className="text-xs font-semibold text-orange-400 bg-orange-400/10 rounded-lg px-3 py-2">Regarding: {listingTitle}</div>
      )}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name *</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full h-12 px-4 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-orange-400/50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone *</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full h-12 px-4 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-orange-400/50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (optional)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full h-12 px-4 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-orange-400/50"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you're looking for…"
          className="w-full min-h-[100px] p-4 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-orange-400/50 resize-y"
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={submitting}
        className="h-12 bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
      >
        {submitting ? "Sending…" : "Request a Callback"}
      </button>
      <p className="text-xs text-muted-foreground text-center">Free, no account needed. We'll call you back within 24 hours.</p>
    </form>
  )
}
