import { redirect } from "next/navigation"
import { AccountHeader } from "@/components/account-header"
import { ProfileView } from "@/components/profile-view"
import { createClient } from "@/lib/supabase/server"
import { getShortlistedListings } from "@/lib/data/listings"
import { getAlertSubscriptions } from "@/lib/data/alerts"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "My Account",
  description: "Your shortlists, alerts, services, and account details.",
  path: "/profile",
  noIndex: true,
})

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=%2Fprofile")
  }

  const [{ data: profile }, shortlisted, alerts] = await Promise.all([
    supabase
      .from("profiles")
      .select('fullName, email, phone, creditsBalance, createdAt, city, "panNumber", "aadhaarNumber"')
      .eq("id", user.id)
      .single(),
    getShortlistedListings(user.id),
    getAlertSubscriptions(user.id),
  ])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <AccountHeader />
      <div className="flex-1">
        <ProfileView
          profile={{
            fullName: profile?.fullName ?? null,
            email: profile?.email ?? user.email ?? "",
            phone: profile?.phone ?? null,
            creditsBalance: profile?.creditsBalance ?? 0,
            memberSince: profile?.createdAt ?? user.created_at,
            city: profile?.city ?? null,
            panNumber: profile?.panNumber ?? null,
            aadhaarNumber: profile?.aadhaarNumber ?? null,
          }}
          shortlisted={shortlisted}
          alerts={alerts}
        />
      </div>
    </main>
  )
}
