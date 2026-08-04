import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProfileView } from "@/components/profile-view"
import { createClient } from "@/lib/supabase/server"
import { getShortlistedListings } from "@/lib/data/listings"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: profile }, shortlisted] = await Promise.all([
    supabase.from("profiles").select("fullName, email, phone, creditsBalance, createdAt").eq("id", user.id).single(),
    getShortlistedListings(user.id),
  ])

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <div className="flex-1">
        <ProfileView
          profile={{
            fullName: profile?.fullName ?? null,
            email: profile?.email ?? user.email ?? "",
            phone: profile?.phone ?? null,
            creditsBalance: profile?.creditsBalance ?? 0,
            memberSince: profile?.createdAt ?? user.created_at,
          }}
          shortlisted={shortlisted}
        />
      </div>
      <Footer />
    </main>
  )
}
