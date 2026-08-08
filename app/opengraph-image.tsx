import { ImageResponse } from "next/og"

// Default social-share card for every page that does not set its own OG image.
// Listing pages override this with their first photo (see generateMetadata in
// app/listing/[slug]/page.tsx).
//
// No headline statistics here on purpose — the "12,400+ auctions" style figures
// are still unverified and awaiting client sign-off (C5), and an OG card is a
// public marketing claim.

export const alt = "Boliwala.com — bank auction properties across India"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "#0A0F1C",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 72,
              height: 72,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #FFC981 0%, #D97706 100%)",
              borderRadius: 18,
            }}
          >
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3E2400"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L11 10" />
              <path d="m16 16 6-6" />
              <path d="m8 8 6-6" />
              <path d="m9 7 8 8" />
              <path d="m21 11-8-8" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Boliwala.com</div>
            <div style={{ fontSize: 16, letterSpacing: 4, color: "#FFC981", textTransform: "uppercase" }}>
              We Know Auctions!
            </div>
          </div>
        </div>

        <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2 }}>
          Bank auction properties,
        </div>
        <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.15, letterSpacing: -2, color: "#FFC981" }}>
          searchable and free to browse.
        </div>

        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.72)", marginTop: 32 }}>
          SARFAESI listings across India — reserve price, EMD, and auction dates, no login required.
        </div>
      </div>
    ),
    size,
  )
}
