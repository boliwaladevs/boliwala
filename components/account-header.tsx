import Link from "next/link"

import { Logo } from "@/components/logo"

/**
 * Minimal chrome for signed-in account pages.
 *
 * /profile used to render the marketing <Header>/<Footer>, so the portal wore
 * the public site's navigation — "Free Consultation", the scroll-to-top logo,
 * the full marketing menu — stacked on top of its own tab sidebar. /admin
 * already avoids this by rendering its own shell; this gives /profile the
 * equivalent instead of borrowing the website's.
 *
 * Credit balance and sign-out are deliberately NOT repeated here: the profile
 * sidebar already carries both, and duplicating them would give the page two
 * competing places to log out from.
 */
export function AccountHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" aria-label="Boliwala home">
          <Logo withTagline={false} />
        </Link>
        <Link
          href="/search"
          className="text-sm font-semibold text-foreground/80 hover:text-blue-600 transition-colors"
        >
          Browse Properties
        </Link>
      </div>
    </header>
  )
}
