import { VerifyView } from "@/components/verify-view"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Verify Email",
  description: "Confirm your email address to activate your Boliwala account.",
  path: "/verify",
  noIndex: true,
})

export default function VerifyPage() {
  return (
    <main>
      <VerifyView />
    </main>
  )
}
