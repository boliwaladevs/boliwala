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
    <div className="bg-background border border-border rounded-xl shadow-sm p-5 md:p-6 mb-8 flex flex-col lg:flex-row items-start lg:items-center gap-5">
      <div className="w-12 h-12 rounded-lg bg-orange-400/10 flex items-center justify-center shrink-0">
        <Bell className="w-6 h-6 text-orange-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground mb-1">Get email alerts for this search</h3>
        <p className="text-sm text-muted-foreground">
          {summary.length > 0
            ? `New properties matching ${summary.join(" · ")} will be emailed to you automatically.`
            : "New properties matching this search will be emailed to you automatically."}
        </p>
      </div>

      {saved ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 mt-4 lg:mt-0">
          <Check className="w-4 h-4" />
          Alert set
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto mt-4 lg:mt-0">
          <label className="sr-only" htmlFor="alert-email">
            Email address for alerts
          </label>
          <input
            id="alert-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="h-10 px-4 border border-border rounded-md text-sm bg-background w-full sm:w-[220px] focus:outline-none focus:border-orange-400/50 placeholder:text-muted-foreground/60"
          />
          <label className="sr-only" htmlFor="alert-frequency">
            Alert frequency
          </label>
          <select
            id="alert-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="h-10 px-3 border border-border rounded-md text-sm bg-background w-full sm:w-[130px] focus:outline-none focus:border-orange-400/50 appearance-none text-foreground/90"
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="h-10 px-5 bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white border-none rounded-md text-sm font-semibold whitespace-nowrap w-full sm:w-auto transition-colors shadow-sm"
          >
            {pending ? "Saving…" : "Set Alert"}
          </button>
        </div>
      )}
    </div>
  )
}
