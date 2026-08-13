/**
 * Public contact details, from the environment.
 *
 * The footer used to hardcode `+1 (234) 567-890` — a US placeholder on an
 * India-only product — and the WhatsApp CTA had no number at all. Reading them
 * from env means the real values are a config change at cutover rather than a
 * code change, and that an unset value renders nothing instead of something
 * false. Blocker C3.
 */

const raw = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || null,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || null,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "hello@boliwala.com",
}

export const CONTACT = {
  email: raw.email,

  /** As typed by the client, for display. */
  phoneDisplay: raw.phone,
  /** Digits and a leading +, for a tel: href. */
  phoneHref: raw.phone ? `tel:${raw.phone.replace(/[^\d+]/g, "")}` : null,

  /** wa.me requires digits only — no +, spaces or dashes. */
  whatsappHref: raw.whatsapp ? `https://wa.me/${raw.whatsapp.replace(/\D/g, "")}` : null,
} as const
