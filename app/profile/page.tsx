import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ProfileView } from "@/components/profile-view"
import { createClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("fullName, email, phone, creditsBalance, createdAt")
    .eq("id", user.id)
    .single()

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
        />
      </div>
      <Footer />
    </main>
  )
}
