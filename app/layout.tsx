import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SmoothScrolling } from "@/components/smooth-scrolling"
import { Toaster } from "@/components/ui/toaster"
import { SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from "@/lib/seo"

const _geistMono = Geist_Mono({ subsets: ["latin"] })

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
})

const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`
const DEFAULT_DESCRIPTION =
  "India's first dedicated platform for SARFAESI bank auction properties. Find, filter, and bid on bank auctions across India."

export const metadata: Metadata = {
  // Lets every page express canonical/OG URLs as paths and resolve correctly.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "v0.app",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: absoluteUrl("/"),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  // No `icons` block: this used to point at /icon-light-32x32.png,
  // /icon-dark-32x32.png, /icon.svg and /apple-icon.png, none of which existed
  // in public/ — all four 404'd. Icons now come from app/icon.tsx and
  // app/apple-icon.tsx via Next's file conventions, which Next links
  // automatically. The light/dark pair is gone; the amber mark reads on both.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-IN" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <SmoothScrolling>
          {children}
        </SmoothScrolling>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
