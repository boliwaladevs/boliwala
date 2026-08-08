import { ImageResponse } from "next/og"

// Placeholder mark, generated from the gavel glyph and amber gradient already
// used by components/logo.tsx — brand-consistent, but not the client's real
// logo, which is still an open asset request. Replacing it means swapping this
// file (or dropping a real icon.png alongside it), no other code changes.

export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FFC981 0%, #D97706 100%)",
          borderRadius: 14,
        }}
      >
        <svg
          width="40"
          height="40"
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
    ),
    size,
  )
}
