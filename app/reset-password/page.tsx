import { ResetPasswordView } from "@/components/reset-password-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Reset Password",
  description: "Choose a new password for your Boliwala account.",
  path: "/reset-password",
  noIndex: true,
})

export default function ResetPasswordPage() {
  return (
    <main>
      <ResetPasswordView />
    </main>
  )
}
