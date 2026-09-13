/**
 * Turns a stored phone/WhatsApp string into a tappable link — never
 * reformats, guesses a country code, or otherwise changes what's actually
 * stored; only strips characters a `tel:`/`wa.me` URL can't contain. The
 * visible text on the page always stays the raw stored value.
 */

export function buildTelHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/** wa.me requires digits only (no +, spaces, or punctuation) — the digits are exactly what's already stored, just stripped of formatting. */
export function buildWhatsAppHref(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
}
