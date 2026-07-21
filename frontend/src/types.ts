export type ContactFieldName = 'nome' | 'telefone' | 'email' | 'assunto' | 'mensagem';

export interface FieldLimit {
  min: number;
  max: number;
}

export type FieldLimits = Record<ContactFieldName, FieldLimit>;

export type CaptchaProviderName = 'turnstile' | 'recaptcha' | 'hcaptcha';

export interface CaptchaProviderConfig {
  name: CaptchaProviderName;
  siteKey: string;
}

export interface SiteConfig {
  contactEmail: string;
  whatsNumber: string;
  whatsLinkNumber: string;
  socialFacebook: string;
  socialInstagram: string;
  captchaEnabled: boolean;
  captchaProviders: CaptchaProviderConfig[];
  turnstileSiteKey: string;
  fieldLimits: FieldLimits;
}

export type ContactValues = Record<ContactFieldName, string> & { website: string };

export type ContactPayload = ContactValues & { captchaProvider: CaptchaProviderName | ''; captchaToken: string };

export interface ContactResponse {
  message: string;
  conversion: boolean;
}
