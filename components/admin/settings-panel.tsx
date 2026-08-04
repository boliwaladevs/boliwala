"use client"

import { useState } from "react"
import { FormSection, Flbl, Finp } from "./ui"
import { updatePricingSettingsAction } from "@/app/actions/admin-settings"
import type { PricingSettings } from "@/lib/access/types"
import { useToast } from "@/hooks/use-toast"

export function SettingsPanel({ initialSettings }: { initialSettings: PricingSettings }) {
  const [freeSignupCredits, setFreeSignupCredits] = useState(initialSettings.freeSignupCredits)
  const [annualPrice, setAnnualPrice] = useState(initialSettings.annualPrice)
  const [servicePackagePrice, setServicePackagePrice] = useState(initialSettings.servicePackagePrice)
  const [successFeePct, setSuccessFeePct] = useState(initialSettings.successFeePct)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    const result = await updatePricingSettingsAction({ freeSignupCredits, annualPrice, servicePackagePrice, successFeePct })
    setSaving(false)
    if (!result.ok) {
      toast({ variant: "destructive", title: "Couldn't save settings", description: result.error })
      return
    }
    toast({ title: "Settings saved", description: "Live everywhere — pricing page, services page, listing pages, and new signups." })
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <FormSection
        title="⚙️ Pricing Controls"
        foot={
          <button disabled={saving} onClick={handleSave} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg disabled:opacity-60">
            {saving ? "Saving…" : "Save Settings"}
          </button>
        }
      >
        <p className="text-sm text-muted-foreground mb-5">
          These values are read live everywhere on the site — search, listing pages, pricing/services pages, and the signup credit grant. Changes apply immediately to new activity; existing users keep whatever they already have.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Flbl>Free Credits per User (on signup)</Flbl>
            <Finp type="number" value={freeSignupCredits} onChange={(v) => setFreeSignupCredits(Number(v))} />
          </div>
          <div>
            <Flbl>Annual Subscription Price (₹)</Flbl>
            <Finp type="number" value={annualPrice} onChange={(v) => setAnnualPrice(Number(v))} />
          </div>
          <div>
            <Flbl>Service Package Price (₹)</Flbl>
            <Finp type="number" value={servicePackagePrice} onChange={(v) => setServicePackagePrice(Number(v))} />
          </div>
          <div>
            <Flbl>Success Fee (%)</Flbl>
            <Finp type="number" value={successFeePct} onChange={(v) => setSuccessFeePct(Number(v))} />
          </div>
        </div>
      </FormSection>
    </div>
  )
}
