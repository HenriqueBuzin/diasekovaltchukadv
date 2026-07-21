export const MESSAGES = {
  apiFallback: 'Não foi possível concluir a solicitação.',
  contactMinChars: 'Informe pelo menos {min} caracteres.',
  contactMessageMinChars: 'Escreva pelo menos {min} caracteres.',
  contactPhoneLength: 'Use DDD + telefone com {min} ou {max} dígitos.',
  contactSubjectShort: 'Descreva melhor o assunto.',
  requiredEmail: 'Informe seu e-mail.',
  requiredMessage: 'Escreva um resumo do caso.',
  requiredName: 'Informe seu nome.',
  requiredPhone: 'Informe seu telefone.',
  requiredSubject: 'Informe o assunto.',
  validEmail: 'Informe um e-mail válido.'
};

export function message(name: keyof typeof MESSAGES, values: Record<string, string | number> = {}) {
  return Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, String(value)), MESSAGES[name]);
}
