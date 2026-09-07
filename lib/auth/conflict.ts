/**
 * The cross-provider collision messages, shared between the OAuth callback that
 * detects one and the login form that has to explain it.
 *
 * Client-safe (no `server-only`) for the same reason lib/auth/landing.ts is:
 * the callback is a route handler and the form is a client component, and the
 * vocabulary has to be identical on both sides or a bounce lands on a page that
 * says nothing.
 */

/** Query parameter set when a sign-in was refused for using the wrong provider. */
export const CONFLICT_PARAM = "conflict"

/** Support line, offered on both collisions. */
export const SUPPORT_WHATSAPP = "919819927007"

/**
 * A wa.me link opens WhatsApp with the message typed into the compose box but
 * NOT sent — the person reads it and presses send themselves. That is the
 * intended behaviour, not a limitation: it lets them correct the address or add
 * detail before it reaches support.
 */
export function whatsappSupportUrl(message: string): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`
}

export function googleAccountSupportMessage(email: string): string {
  return `Hi Boliwala, I can't log in. My account ${email} is registered with Google sign-in and I need help.`
}

export function passwordAccountSupportMessage(email: string): string {
  return `Hi Boliwala, I can't log in. My account ${email} is registered with an email password and I need help.`
}
