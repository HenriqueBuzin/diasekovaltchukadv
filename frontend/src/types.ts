export type ContactFieldName = 'nome' | 'telefone' | 'email' | 'assunto' | 'mensagem';

export interface FieldLimit {
  min: number;
  max: number;
}

export type FieldLimits = Record<ContactFieldName, FieldLimit>;

export interface SiteConfig {
  contactEmail: string;
  whatsNumber: string;
  whatsLinkNumber: string;
  socialFacebook: string;
  socialInstagram: string;
  captchaEnabled: boolean;
  turnstileSiteKey: string;
  fieldLimits: FieldLimits;
}

export type ContactValues = Record<ContactFieldName, string> & { website: string };

export type ContactPayload = ContactValues & { captchaToken: string };

export interface ContactResponse {
  message: string;
  conversion: boolean;
}
