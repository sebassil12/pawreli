// Single source of truth for contact + pricing. Referenced by the landing.
// PLACEHOLDER: replace `whatsapp` with the real number before going live.

/** E.164 without the leading + (country code first). Placeholder value. */
export const WHATSAPP = '593999999999';

export const PRECIOS = {
  placa: 15,
  kit: 32,
} as const;

/** Builds a wa.me link with a URL-encoded preset message. */
export function whatsappLink(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
