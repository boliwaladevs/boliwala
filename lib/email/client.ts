import "server-only"

/**
 * Sends one email through Resend's HTTP API.
 *
 * Deliberately a bare `fetch` rather than the `resend` SDK. Sending an email is
 * one POST with a bearer token, and this app ships as a Cloudflare Worker whose
 * bundle is already at 85% of the 3 MB free cap (MEMORY.md §41) — a dependency
 * that saves no meaningful code is not worth the headroom. `fetch` is native on
 * Workers and on Node 18+, so there is nothing to install.
 *
 * Only one email is sent from application code: the Google-signup welcome in
 * ./welcome.ts. Every other message — the signup confirmation with its OTP, and
 * the password reset — is sent by Supabase Auth, whose SMTP points at this same
 * Resend account, so those templates live in the Supabase dashboard.
 *
 * Never throws. A missing credential or a refused send must never turn a
 * working sign-in into a 500; the caller logs and carries on. Returns whether
 * the send actually succeeded, which is what callers stamp their idempotency
 * key on.
 */
export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!key || !from) {
    console.warn("[email] skipped — RESEND_API_KEY or RESEND_FROM_EMAIL is not set")
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html }),
    })

    if (!response.ok) {
      // Resend puts the reason in the body; the status alone is rarely enough
      // to tell a bad key from an unverified sending domain.
      console.error(`[email] send failed (${response.status}):`, await response.text())
      return false
    }
    return true
  } catch (err) {
    console.error("[email] send threw:", err)
    return false
  }
}
