// Single source of truth for contact + pricing. Referenced by the landing.

/** E.164 without the leading + (country code first). */
export const WHATSAPP = '593987838130';

// `antes` is the original price shown struck-through; the lower value is what
// the customer pays (launch discount).
export const PRECIOS = {
  placa: 10,
  placaAntes: 15,
  kit: 18,
  kitAntes: 32,
} as const;

/** Builds a wa.me link with a URL-encoded preset message. */
export function whatsappLink(mensaje: string): string {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
