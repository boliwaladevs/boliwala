# Auth email templates

Three emails, sent by two different systems. Knowing which is which matters,
because only two of them are editable in the Supabase dashboard.

| Email | Sent by | Lives in |
|---|---|---|
| Welcome + verify (password signup) | Supabase Auth → Resend SMTP | `confirm-signup.html` → paste into the dashboard |
| Reset password | Supabase Auth → Resend SMTP | `reset-password.html` → paste into the dashboard |
| Welcome (Google signup) | **Our own code** | `lib/email/welcome.ts` — edit the code, not this folder |

The Google one is in code because Supabase never mails an OAuth signup: there is
no address to confirm, so it sends nothing at all. Without our own message a
Google user hears silence and has no way to tell that the missing verification
email is correct rather than lost.

## Installing the two dashboard templates

**Authentication → Emails → Templates**, one at a time. Copy the file contents
(the HTML comment at the top is a note to you and can stay — it does not render).

Subject lines:

- Confirm signup → `Welcome to Boliwala — verify your email`
- Reset password → `Reset your Boliwala password`

## The one trap

**`{{ .ConfirmationURL }}` verifies the account the instant it is clicked.**

That is correct for the reset email, where the link is *supposed* to consume its
token and open a live recovery session.

It is wrong for the signup email, and using it there silently breaks the
requirement. The flow is "click the link, then enter the code" — so the signup
button points at our own `{{ .SiteURL }}/verify?email={{ .Email }}` page, and
`{{ .Token }}` is what actually verifies, through
`verifyOtp({ type: "signup" })` in `components/verify-view.tsx`. If someone
"tidies up" that href to `{{ .ConfirmationURL }}` later, the code box becomes
decorative and anyone with the link is verified without it.

## `{{ .SiteURL }}` is not `NEXT_PUBLIC_SITE_URL`

It comes from **Authentication → URL Configuration**, and it is a separate
setting from anything in `.env.local`. If it is left at `http://localhost:3000`,
every link in every one of these emails points at the recipient's own machine.

## Before any of this delivers

- SMTP must be pointed at Resend (`smtp.resend.com:465`, user `resend`, password
  = `RESEND_API_KEY`).
- **"Confirm email" must be ON** under Authentication → Providers → Email. It is
  the switch that makes the signup template fire at all.
- `/verify` must be in the redirect allowlist.
- The sending domain must be verified in Resend, or delivery fails.

Full checklist with the exact field values: `MEMORY.md` §43.5.
