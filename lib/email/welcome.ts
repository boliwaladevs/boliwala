import "server-only"
import { sendEmail } from "./client"

/**
 * The welcome email for an account created with Google sign-in.
 *
 * This is the one message Supabase Auth cannot send for us. Its "Confirm
 * signup" template fires only for password signups, because that is the flow
 * with an address to confirm — a Google account arrives with an address Google
 * has already verified. So a Google user would otherwise hear nothing at all on
 * signup, and would have no way to know that the absence of a verification
 * email is correct rather than a delivery failure. Hence the note in the copy.
 *
 * Never throws. A welcome email is the least important thing happening during a
 * sign-in; if it fails, the user is still signed in and the caller leaves
 * `welcomeEmailSentAt` null so the next sign-in tries again.
 *
 * Returns whether the send succeeded, which is what the caller stamps on.
 */
export async function sendGoogleWelcomeEmail(to: string, fullName: string | null): Promise<boolean> {
  const name = fullName?.trim().split(/\s+/)[0] || "there"
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://boliwala.com"

  return sendEmail({
    to,
    subject: "Welcome to Boliwala",
    html: `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0A0F1C">
  <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;margin-bottom:32px">
    Boli<span style="color:#2563eb">wala</span>
  </div>

  <h1 style="font-size:22px;font-weight:700;margin:0 0 16px">Welcome, ${escapeHtml(name)}.</h1>

  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#3f4756">
    Your Boliwala account is ready. You can browse verified SARFAESI and NPA auction
    listings from lenders across India, shortlist the ones you want, and set alerts
    for new properties matching what you're after.
  </p>

  <div style="background:#f1f5f9;border-left:3px solid #2563eb;padding:14px 16px;margin:24px 0;font-size:14px;line-height:1.6;color:#3f4756">
    <strong style="color:#0A0F1C">No email verification needed.</strong><br />
    You signed up with Google, so your email address is already verified. There is
    nothing else for you to confirm — just sign in with Google whenever you return.
  </div>

  <p style="margin:28px 0">
    <a href="${site}/search" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;font-size:15px;padding:12px 24px;border-radius:8px;text-decoration:none">
      Browse auction properties
    </a>
  </p>

  <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:32px 0 0;padding-top:20px;border-top:1px solid #e5e7eb">
    You're receiving this because an account was created at Boliwala with this email
    address. If that wasn't you, reply to this email and we'll remove it. Need help?
    WhatsApp us on
    <a href="https://wa.me/919819927007" style="color:#2563eb;text-decoration:none">+91 98199 27007</a>.
  </p>
</div>`.trim(),
  })
}

/** The name comes from Google's profile data, so it is not ours to trust. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
