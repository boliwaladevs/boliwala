import { LegalPage } from "@/components/legal-page"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Boliwala.com collects, uses and protects the personal information of people who browse and register on the platform.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="What we collect when you browse, search or create an account on Boliwala, what we do with it, and how to ask us about it."
    />
  )
}
