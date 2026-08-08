import { AuthView } from "@/components/auth-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Log In",
  description: "Log in to your Boliwala account to unlock property details, save shortlists, and manage alerts.",
  path: "/login",
  noIndex: true,
})

export default function LoginPage() {
  return (
    <main>
      <AuthView defaultTab="login" />
    </main>
  )
}
