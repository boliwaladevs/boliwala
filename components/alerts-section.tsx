"use client"

import { useState } from "react"
import { ArrowRight, Bell, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

const ALERT_FIELD =
  "h-[46px] w-full rounded-field border border-white/20 bg-white/10 px-3.5 text-[14.5px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-[var(--logo-tile-from)]"
const ALERT_LABEL = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/60"

export function AlertsSection() {
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from("alert_subscriptions").insert({
      email,
      whatsapp: whatsapp || null,
      filters: {},
    })
    setSubmitting(false)
    if (error) {
      toast({ variant: "destructive", title: "Couldn't set up alerts", description: error.message })
      return
    }
    setSubmitted(true)
  }

  return (
    <section className="mx-auto max-w-[1240px] px-5 pb-14">
      {/* An inverted panel: it must stay dark in BOTH themes, so dark mode
          swaps to --paper rather than letting --ink flip to cream. */}
      <div className="grid gap-10 rounded-[24px] bg-ink px-6 py-10 md:grid-cols-2 md:px-8 md:py-11 dark:border dark:border-line dark:bg-paper">
        <div>
          <div className="mb-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <Bell className="h-5 w-5 text-[var(--logo-tile-from)]" />
          </div>
          <h2 className="mb-4 font-serif text-[30px] font-semibold leading-[1.12] tracking-[-0.02em] text-white md:text-4xl">
            Never miss a lucrative auction again.
          </h2>
          <p className="mb-7 max-w-lg text-base leading-relaxed text-white/70">
            Set up free alerts and be the first to know when a property matching your criteria goes under the hammer.
          </p>

          <ul className="space-y-3">
            {[
              "Instant alerts for new properties in your city.",
              "Updates on price drops or auction cancellations.",
              "Reminders 24 hours before the auction starts.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14.5px] text-white/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--logo-tile-from)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card bg-white/[0.07] p-6 md:p-7">
          <h3 className="mb-5 font-serif text-[22px] font-semibold text-white">Set Up Free Alerts</h3>

          {submitted ? (
            <div className="flex items-center gap-3 py-4 text-[14.5px] text-white/90">
              <Check className="h-5 w-5 shrink-0 text-[var(--logo-tile-from)]" />
              You're subscribed — we'll email you when a matching auction goes live.
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={ALERT_LABEL} htmlFor="alert-email">
                  Email Address
                </label>
                <input
                  id="alert-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={ALERT_FIELD}
                />
              </div>

              <div>
                <label className={ALERT_LABEL} htmlFor="alert-whatsapp">
                  WhatsApp Number
                </label>
                <input
                  id="alert-whatsapp"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className={ALERT_FIELD}
                />
              </div>

              <button
                disabled={submitting}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-[var(--logo-tile-from)] text-[14.5px] font-bold text-[var(--logo-mark-ink)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Subscribing…" : "Subscribe to Alerts"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-center text-xs text-white/50">We respect your privacy. Unsubscribe at any time.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
