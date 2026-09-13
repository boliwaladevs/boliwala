"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { currentPath, withNext } from "@/lib/auth/next-param"
import { landingPathForRole } from "@/lib/auth/landing"

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Properties", href: "/search" },
  { label: "Services", href: "/services" },
  { label: "Channel Partner", href: "/partner" },
  { label: "About", href: "/about" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // null = not yet known. Rendering the signed-out links while the session is
  // still resolving would flash "Log In" at someone who is already signed in,
  // so the cluster stays empty until we know which state to show.
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  // Where "My Account" goes. One email means one role, so an admin and a
  // channel partner have no use for the customer profile page — this used to
  // send every role to /profile regardless. Defaults to /profile so an
  // unreadable role behaves like an ordinary customer, which is also what
  // postLoginPath does and what the guards on /admin and /partner/dashboard
  // assume.
  const [accountHref, setAccountHref] = useState("/profile")
  const pathname = usePathname()

  // Where a Log In click should come back to. Only computed once the session
  // state is known, which is also the only time the link is rendered — before
  // that there is no browser location to read on the server pass.
  const loginHref = signedIn === false ? withNext("/login", currentPath()) : "/login"

  useEffect(() => {
    const supabase = createClient()
    let active = true

    // The role decides where "My Account" points, so it is resolved alongside
    // the session rather than in a second effect — the link is only rendered
    // once `signedIn` is known, which gives this the same window to finish in.
    const resolve = async (userId: string | undefined) => {
      if (!userId) {
        if (active) setAccountHref("/profile")
        return
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", userId).single()
      if (active) setAccountHref(landingPathForRole(data?.role))
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return
      setSignedIn(!!data.user)
      void resolve(data.user?.id)
    })

    // Keeps the header honest after a sign-in or sign-out that happens on
    // another tab, or on the same tab without a full navigation.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setSignedIn(!!session?.user)
      void resolve(session?.user?.id)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="relative z-40 border-b border-line bg-paper">
      <div className="mx-auto flex min-h-[72px] max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 sm:gap-4 sm:px-5">
        <Link href="/" aria-label="Boliwala home">
          <Logo />
        </Link>

        <nav className="hidden flex-wrap items-center gap-[26px] text-[14.5px] font-medium lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "transition-colors hover:text-brand",
                pathname === item.href ? "font-semibold text-ink" : "text-ink2",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Only shows once there is room for it alongside the auth links. */}
          <Link
            href="/contact"
            className="hidden items-center rounded-pill border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface xl:inline-flex"
          >
            Free Consultation
          </Link>

          {signedIn === null ? null : signedIn ? (
            <Link
              href={accountHref}
              className="inline-flex items-center whitespace-nowrap rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90"
            >
              My Account
            </Link>
          ) : (
            <>
              <Link
                href={loginHref}
                className="hidden items-center whitespace-nowrap rounded-pill px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface lg:inline-flex"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center whitespace-nowrap rounded-pill bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition-opacity hover:opacity-90"
              >
                Sign Up
              </Link>
            </>
          )}

          <button
            className="flex h-11 w-11 items-center justify-center rounded-pill border border-line text-ink transition-colors hover:bg-surface lg:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-line lg:hidden">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-1 px-5 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  "flex min-h-11 items-center rounded-field px-3 text-[15px] transition-colors hover:bg-surface",
                  pathname === item.href ? "font-semibold text-ink" : "text-ink2",
                )}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className="mt-2 flex min-h-11 items-center justify-center rounded-pill border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface"
            >
              Free Consultation
            </Link>

            {signedIn === false && (
              <Link
                href={loginHref}
                onClick={closeMobileMenu}
                className="flex min-h-11 items-center justify-center rounded-pill border border-line text-sm font-semibold text-ink transition-colors hover:bg-surface"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
