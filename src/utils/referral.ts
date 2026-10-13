/**
 * Lead attribution for a WhatsApp-only funnel: channel links carry `?ref=<code>`
 * and the landing appends "(vengo de <label>)" to the prefilled WhatsApp text,
 * so every chat states where it came from. Whitelisted: the URL never injects free text.
 */
const SOURCES = new Map([
  ['ig', 'Instagram'],
  ['fb', 'Facebook'],
  ['tt', 'TikTok'],
  ['placa', 'una placa Pawreli'],
  ['vet', 'una veterinaria'],
]);

export function referralLabel(search: string): string | undefined {
  const code = new URLSearchParams(search).get('ref')?.toLowerCase();
  return code ? SOURCES.get(code) : undefined;
}

export function withReferral(href: string, label: string): string {
  if (!href.startsWith('https://wa.me/')) return href;
  const url = new URL(href);
  const text = `${url.searchParams.get('text') ?? ''} (vengo de ${label})`.trim();
  // Same encoding as whatsappLink(): searchParams.set() would turn spaces into "+".
  return `${url.origin}${url.pathname}?text=${encodeURIComponent(text)}`;
}
