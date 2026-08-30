/**
 * The `?next=` redirect parameter used by the login/signup pages.
 *
 * Client-safe on purpose — no `server-only` import — because the auth form is a
 * client component, the gated CTAs are client components, and the OAuth callback
 * is a route handler. Same reasoning as `landing.ts`, which this sits beside.
 */

export const NEXT_PARAM = "next"

/**
 * Cookie used to carry `next` across the Google OAuth round trip.
 *
 * The alternative — appending `?next=` to the `redirectTo` handed to Supabase —
 * would change the callback URL that Supabase matches against its redirect
 * allowlist, and that allowlist cannot be checked or edited from here. A cookie
 * keeps the callback URL byte-identical to the one already working.
 */
export const NEXT_COOKIE = "bw_next"

/**
 * Open-redirect guard: a value is only usable if it is a path on this site.
 *
 * Rejects absolute URLs, protocol-relative `//evil.com`, the backslash variants
 * browsers normalise into it, and control characters. Query and hash are kept —
 * returning someone to `/search?city=pune` is the whole point.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith("/")) return null
  if (raw.startsWith("//")) return null
  if (raw.includes("\\")) return null
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i)
    if (c < 0x20 || c === 0x7f) return null
  }
  return raw
}

/** Build `/login?next=…`, or plain `/login` when there is nothing worth keeping. */
export function withNext(base: string, next: string | null | undefined): string {
  const safe = safeNextPath(next)
  return safe ? `${base}?${NEXT_PARAM}=${encodeURIComponent(safe)}` : base
}

/**
 * The page the user is on right now, as a `next` value. Read from
 * `window.location` rather than `useSearchParams()` so that callers stay usable
 * from event handlers without forcing their page out of static rendering.
 */
export function currentPath(): string {
  return `${window.location.pathname}${window.location.search}`
}

/** The `next` already sitting in the current URL, validated. Client-side only. */
export function nextFromLocation(): string | null {
  return safeNextPath(new URLSearchParams(window.location.search).get(NEXT_PARAM))
}
