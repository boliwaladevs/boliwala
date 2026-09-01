"use client"

import { useState } from "react"
import { FormSection, Flbl, Finp } from "./ui"
import { updatePricingSettingsAction, updateCommissionSettingsAction } from "@/app/actions/admin-settings"
import type { PricingSettings, CommissionSettings } from "@/lib/access/types"
import { useToast } from "@/hooks/use-toast"

export function SettingsPanel({ initialSettings, initialCommission }: { initialSettings: PricingSettings; initialCommission: CommissionSettings }) {
  const [freeSignupCredits, setFreeSignupCredits] = useState(initialSettings.freeSignupCredits)
  const [annualPrice, setAnnualPrice] = useState(initialSettings.annualPrice)
  const [servicePackagePrice, setServicePackagePrice] = useState(initialSettings.servicePackagePrice)
  const [successFeePct, setSuccessFeePct] = useState(initialSettings.successFeePct)
  const [subscriptionPct, setSubscriptionPct] = useState(initialCommission.subscriptionPct)
  const [packagePct, setPackagePct] = useState(initialCommission.packagePct)
  const [commissionSuccessFeePct, setCommissionSuccessFeePct] = useState(initialCommission.successFeePct)
  const [attributionDays, setAttributionDays] = useState(initialCommission.attributionDays)
  // Blank means "not decided", which is the current truth. Held as strings so an
  // empty box stays empty instead of collapsing to 0.
  const [silverMin, setSilverMin] = useState(initialCommission.silverMinConversions?.toString() ?? "")
  const [goldMin, setGoldMin] = useState(initialCommission.goldMinConversions?.toString() ?? "")
  const [savingCommission, setSavingCommission] = useState(false)
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

  const handleSaveCommission = async () => {
    setSavingCommission(true)
    const result = await updateCommissionSettingsAction({
      subscriptionPct,
      packagePct,
      successFeePct: commissionSuccessFeePct,
      attributionDays,
      silverMinConversions: silverMin.trim() === "" ? null : Number(silverMin),
      goldMinConversions: goldMin.trim() === "" ? null : Number(goldMin),
    })
    setSavingCommission(false)
    if (!result.ok) {
      toast({ variant: "destructive", title: "Couldn't save commission settings", description: result.error })
      return
    }
    toast({ title: "Commission settings saved", description: "Applies to new commissions only — existing ones keep the rate they accrued at." })
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

      <FormSection
        title="🤝 Channel Partner Commission"
        foot={
          <button disabled={savingCommission} onClick={handleSaveCommission} className="h-9 px-5 bg-primary text-primary-foreground font-semibold text-[13px] rounded-lg disabled:opacity-60">
            {savingCommission ? "Saving…" : "Save Commission Settings"}
          </button>
        }
      >
        <p className="text-sm text-muted-foreground mb-5">
          Rates apply to <strong className="text-foreground">new commissions only</strong> — every commission already
          earned keeps the rate it was accrued at, and the change is written to the audit log.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Flbl>Commission on an annual membership (%)</Flbl>
            <Finp type="number" value={subscriptionPct} onChange={(v) => setSubscriptionPct(Number(v))} />
          </div>
          <div>
            <Flbl>Commission on a service package (%)</Flbl>
            <Finp type="number" value={packagePct} onChange={(v) => setPackagePct(Number(v))} />
          </div>
          <div>
            <Flbl>Commission on success fees (%)</Flbl>
            <Finp type="number" value={commissionSuccessFeePct} onChange={(v) => setCommissionSuccessFeePct(Number(v))} />
            <p className="text-xs text-muted-foreground mt-1.5">
              Nothing records a success fee yet, so this rate cannot accrue against anything. It is here because the
              spec asks for it.
            </p>
          </div>
          <div>
            <Flbl>Referral attribution window (days)</Flbl>
            <Finp type="number" value={attributionDays} onChange={(v) => setAttributionDays(Number(v))} />
          </div>
          <div>
            <Flbl>Silver tier — minimum conversions</Flbl>
            <Finp type="number" value={silverMin} onChange={setSilverMin} placeholder="not decided yet" />
          </div>
          <div>
            <Flbl>Gold tier — minimum conversions</Flbl>
            <Finp type="number" value={goldMin} onChange={setGoldMin} placeholder="not decided yet" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Leave a tier blank while the thresholds are undecided — admins assign tiers by hand from the Channel
          Partners panel, and a blank threshold is honest about that. A 0 would read as "everyone qualifies".
        </p>
      </FormSection>
    </div>
  )
}
