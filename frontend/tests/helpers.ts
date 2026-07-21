import type { SiteConfig } from '../src/types';

export const siteConfig: SiteConfig = {
  contactEmail: 'contato@example.com',
  whatsNumber: '55 (48) 98802-6847',
  whatsLinkNumber: '5548988026847',
  socialFacebook: 'https://facebook.com/example',
  socialInstagram: 'https://instagram.com/example',
  captchaEnabled: false,
  captchaProviders: [],
  turnstileSiteKey: '',
  fieldLimits: {
    nome: { min: 3, max: 120 },
    email: { min: 3, max: 160 },
    telefone: { min: 10, max: 11 },
    assunto: { min: 3, max: 160 },
    mensagem: { min: 10, max: 1200 }
  }
};
