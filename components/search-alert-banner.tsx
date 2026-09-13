"use client"

import { useState, useTransition } from "react"
import { Bell, Check } from "lucide-react"

import { saveSearchAlert } from "@/app/actions/alerts"
import { useToast } from "@/hooks/use-toast"

/**
 * "Get email alerts for this search". The enclosing results view is a server
 * component, so the interactive part lives here.
 *
 * `queryString` is passed down rather than read from useSearchParams so the
 * filters saved are exactly the ones that produced the results on screen.
 */
export function SearchAlertBanner({
  queryString,
  summary,
  defaultEmail,
}: {
  queryString: string
  summary: string[]
  defaultEmail?: string
}) {
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [frequency, setFrequency] = useState("instant")
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveSearchAlert(queryString, email, frequency)

      if ("error" in result) {
        toast({ variant: "destructive", title: "Couldn't set that alert", description: result.error })
        return
      }

      setSaved(true)
      toast(
        result.duplicate
          ? { title: "You're already subscribed to this search" }
          : { title: "Alert set", description: `We'll email ${email} when new properties match.` },
      )
    })
  }

  return (
    <div className="mb-8 flex flex-col items-start gap-5 rounded-card border border-line bg-paper p-5 md:p-6 lg:flex-row lg:items-center">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-soft">
        <Bell className="h-5 w-5 text-gold" />
      </div>
      <div className="flex-1">
        <h3 className="mb-1 text-base font-bold text-ink">Get email alerts for this search</h3>
        <p className="text-[13.5px] text-ink2">
          {summary.length > 0
            ? `New properties matching ${summary.join(" · ")} will be emailed to you automatically.`
            : "New properties matching this search will be emailed to you automatically."}
        </p>
      </div>

      {saved ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-pos lg:mt-0">
          <Check className="h-4 w-4" />
          Alert set
        </div>
      ) : (
        <div className="mt-4 flex w-full flex-col items-center gap-3 sm:flex-row lg:mt-0 lg:w-auto">
          <label className="sr-only" htmlFor="alert-email">
            Email address for alerts
          </label>
          <input
            id="alert-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="h-11 w-full rounded-field border border-line bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-ink2/70 focus:border-brand sm:w-[220px]"
          />
          <label className="sr-only" htmlFor="alert-frequency">
            Alert frequency
          </label>
          <select
            id="alert-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="h-11 w-full rounded-field border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand sm:w-[130px]"
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="h-11 w-full whitespace-nowrap rounded-pill bg-brand px-5 text-sm font-bold text-on-brand transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Saving…" : "Set Alert"}
          </button>
        </div>
      )}
    </div>
  )
}
