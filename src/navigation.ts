import { getPermalink } from './utils/permalinks';

export const headerData = {
  links: [
    { text: 'Cómo funciona', href: getPermalink('/#como-funciona') },
    { text: 'Precios', href: getPermalink('/#precios') },
  ],
  actions: [],
};

export const footerData = {
  links: [],
  secondaryLinks: [
    { text: 'Términos', href: getPermalink('/terms') },
    { text: 'Privacidad', href: getPermalink('/privacy') },
  ],
  socialLinks: [],
  footNote: `© ${new Date().getFullYear()} Pawreli · Cuenca, Ecuador`,
};
