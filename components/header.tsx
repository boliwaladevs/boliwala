"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // null = not yet known. Rendering the signed-out links while the session is
  // still resolving would flash "Log In" at someone who is already signed in,
  // so the cluster stays empty until we know which state to show.
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const pathname = usePathname()

  const isHome = pathname === "/"
  const isDarkBg = isHome || scrolled || mobileMenuOpen

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(!!data.user)
    })

    // Keeps the header honest after a sign-in or sign-out that happens on
    // another tab, or on the same tab without a full navigation.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session?.user)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <header
      className={cn(
        "fixed z-50 transition-all duration-500 my-0 py-0 rounded-none",
        scrolled || mobileMenuOpen
          ? "bg-primary backdrop-blur-md py-4 top-4 left-4 right-4 rounded-2xl"
          : "bg-transparent py-4 top-0 left-0 right-0",
      )}
    >
      <nav className="container mx-auto px-6 flex items-center justify-between md:px-[24]">
        <Link href="/" onClick={scrollToTop}>
          <Logo forceWhite={isDarkBg} />
        </Link>

        <ul className="hidden md:flex items-center gap-10 text-sm tracking-wide">
          {[
            { label: "Home", href: "/" },
            { label: "Properties", href: "/search" },
            { label: "Services", href: "/services" },
            { label: "Channel Partner", href: "/partner" },
            { label: "About", href: "/about" },
          ].map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "hover:text-[rgb(251,146,60)] transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-[rgb(251,146,60)] after:transition-all after:duration-300",
                  isDarkBg ? "text-white" : "text-foreground font-medium"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-4">
          {/* Only shows once there is room for it alongside the auth links. */}
          <Link
            href="/contact"
            className="hidden lg:inline-flex items-center gap-2 text-sm px-5 py-2.5 bg-white text-foreground border border-foreground/20 hover:bg-foreground hover:text-white transition-all duration-300"
          >
            Free Consultation
          </Link>

          {signedIn === null ? null : signedIn ? (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-sm px-5 py-2.5 bg-[rgb(251,146,60)] text-white hover:bg-[rgb(234,128,42)] transition-all duration-300"
            >
              My Account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "text-sm tracking-wide hover:text-[rgb(251,146,60)] transition-colors duration-300",
                  isDarkBg ? "text-white" : "text-foreground font-medium",
                )}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm px-5 py-2.5 bg-[rgb(251,146,60)] text-white hover:bg-[rgb(234,128,42)] transition-all duration-300"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className={cn(
            "md:hidden z-50 transition-colors duration-300",
            isDarkBg ? "text-white" : "text-foreground"
          )}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          )}
        </button>
      </nav>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-[600px] opacity-100 mt-8" : "max-h-0 opacity-0",
        )}
      >
        <div className="container mx-auto px-6">
          <ul className="flex flex-col gap-6 mb-8">
            {[
              { label: "Home", href: "/" },
              { label: "Properties", href: "/search" },
              { label: "Services", href: "/services" },
              { label: "Channel Partner", href: "/partner" },
              { label: "About", href: "/about" },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="hover:text-[rgb(251,146,60)] transition-colors duration-300 text-white text-4xl font-light block"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 mb-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-white text-foreground border border-foreground/20 hover:bg-foreground hover:text-white transition-all duration-300"
              onClick={closeMobileMenu}
            >
              Free Consultation
            </Link>

            {signedIn === null ? null : signedIn ? (
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-[rgb(251,146,60)] text-white hover:bg-[rgb(234,128,42)] transition-all duration-300"
                onClick={closeMobileMenu}
              >
                My Account
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 border border-white/30 text-white hover:bg-white/10 transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 text-sm px-5 py-2.5 bg-[rgb(251,146,60)] text-white hover:bg-[rgb(234,128,42)] transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
