import { ForgotPasswordView } from "@/components/forgot-password-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Forgot Password",
  description: "Request a link to set a new password for your Boliwala account.",
  path: "/forgot-password",
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <main>
      <ForgotPasswordView />
    </main>
  )
}
