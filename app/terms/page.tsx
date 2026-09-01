import { LegalPage } from "@/components/legal-page"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "The terms on which Boliwala.com provides access to SARFAESI auction listings, credits, memberships and service packages.",
  path: "/terms",
})

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="The terms on which we provide listings, credits, memberships and service packages — and what we do and do not promise about auction information published by lenders."
    />
  )
}
