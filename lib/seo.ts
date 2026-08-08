import type { Metadata } from "next"

/**
 * Every absolute URL the site emits — canonicals, Open Graph, sitemap, JSON-LD
 * — is derived from here, so the production domain cutover is a change to
 * NEXT_PUBLIC_SITE_URL and nothing else. Do not hardcode a domain anywhere.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")

export const SITE_NAME = "Boliwala.com"
export const SITE_TAGLINE = "We Know Auctions!"

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Page-level metadata with a canonical attached. `title` is passed through the
 * root layout's template, so pass the bare page name, not the full title.
 */
export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  const url = absoluteUrl(path)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: "website" },
    twitter: { card: "summary_large_image", title, description },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  }
}
