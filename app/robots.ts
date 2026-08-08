import type { MetadataRoute } from "next"

import { absoluteUrl } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Authenticated and transactional surfaces. None of these are useful in
      // an index, and /auth/callback carries a one-time OAuth code.
      disallow: ["/admin", "/profile", "/partner/dashboard", "/auth/", "/reset-password"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
