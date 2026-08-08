import { AuthView } from "@/components/auth-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Create a Free Account",
  description: "Create a free Boliwala account to unlock property details, save shortlists, and get auction alerts.",
  path: "/signup",
  noIndex: true,
})

export default function SignupPage() {
  return (
    <main>
      <AuthView defaultTab="signup" />
    </main>
  )
}
