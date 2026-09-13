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
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex min-h-[72px] max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Boliwala home">
          <Logo withTagline={false} />
        </Link>
        <Link
          href="/search"
          className="inline-flex min-h-11 items-center rounded-pill border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface"
        >
          Browse Properties
        </Link>
      </div>
    </header>
  )
}
