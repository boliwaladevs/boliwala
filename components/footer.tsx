import Link from "next/link"
import { Logo } from "@/components/logo"
import { CONTACT } from "@/lib/contact"

const LINK_CLASS = "text-sm text-ink2 transition-colors hover:text-ink"
const HEADING_CLASS = "mb-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink2"

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper pt-11">
      <div className="mx-auto max-w-[1240px] px-5">
        <div className="mb-10 grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-5 inline-block">
              <Logo />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-ink2">
              India's first dedicated platform for SARFAESI bank auction properties. We know auctions, so you don't have to.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className={HEADING_CLASS}>Platform</h4>
            <ul className="space-y-3">
              <li>
                <Link href="#search" className={LINK_CLASS}>
                  Search Auctions
                </Link>
              </li>
              <li>
                <Link href="#pricing" className={LINK_CLASS}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#services" className={LINK_CLASS}>
                  Services
                </Link>
              </li>
              <li>
                <Link href="#partner" className={LINK_CLASS}>
                  Channel Partner
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={HEADING_CLASS}>Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${CONTACT.email}`} className={LINK_CLASS}>
                  {CONTACT.email}
                </a>
              </li>
              {/* Rendered only once a real number is configured — showing
                  nothing beats showing a placeholder someone might dial. */}
              {CONTACT.phoneHref && (
                <li>
                  <a href={CONTACT.phoneHref} className={LINK_CLASS}>
                    {CONTACT.phoneDisplay}
                  </a>
                </li>
              )}
              {CONTACT.whatsappHref && (
                <li>
                  <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                    WhatsApp
                  </a>
                </li>
              )}
              <li>
                <a href="#" className={LINK_CLASS}>
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className={LINK_CLASS}>
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-[13px] text-ink2">
          <p>© 2026 Boliwala.com. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
