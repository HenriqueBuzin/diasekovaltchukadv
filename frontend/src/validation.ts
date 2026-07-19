import { onlyDigits } from './phone';
import type { ContactFieldName, ContactValues, FieldLimit, FieldLimits } from './types';

export function validateField(name: string, value: string, limits: FieldLimit): string {
  const trimmed = value.trim();
  if (name === 'nome') {
    if (!trimmed) return 'Informe seu nome.';
    if (trimmed.length < limits.min) return `Informe pelo menos ${limits.min} caracteres.`;
  }
  if (name === 'email') {
    if (!trimmed) return 'Informe seu e-mail.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return 'Informe um e-mail válido.';
  }
  if (name === 'telefone') {
    const digits = onlyDigits(value);
    if (!digits) return 'Informe seu telefone.';
    if (digits.length < limits.min || digits.length > limits.max) {
      return `Use DDD + telefone com ${limits.min} ou ${limits.max} dígitos.`;
    }
  }
  if (name === 'assunto') {
    if (!trimmed) return 'Informe o assunto.';
    if (trimmed.length < limits.min) return 'Descreva melhor o assunto.';
  }
  if (name === 'mensagem') {
    if (!trimmed) return 'Escreva um resumo do caso.';
    if (trimmed.length < limits.min) return `Escreva pelo menos ${limits.min} caracteres.`;
  }
  return '';
}

export function validateContact(values: ContactValues, rules: FieldLimits): Partial<Record<ContactFieldName, string>> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([name]) => name in rules)
      .map(([name, value]) => [name, validateField(name, value, rules[name as ContactFieldName])])
      .filter(([, message]) => message)
  ) as Partial<Record<ContactFieldName, string>>;
}
