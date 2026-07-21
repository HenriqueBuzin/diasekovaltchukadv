import { message } from './messages';
import { onlyDigits } from './phone';
import type { ContactFieldName, ContactValues, FieldLimit, FieldLimits } from './types';

export function validateField(name: string, value: string, limits: FieldLimit): string {
  const trimmed = value.trim();
  if (name === 'nome') {
    if (!trimmed) return message('requiredName');
    if (trimmed.length < limits.min) return message('contactMinChars', { min: limits.min });
  }
  if (name === 'email') {
    if (!trimmed) return message('requiredEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return message('validEmail');
  }
  if (name === 'telefone') {
    const digits = onlyDigits(value);
    if (!digits) return message('requiredPhone');
    if (digits.length < limits.min || digits.length > limits.max) {
      return message('contactPhoneLength', { min: limits.min, max: limits.max });
    }
  }
  if (name === 'assunto') {
    if (!trimmed) return message('requiredSubject');
    if (trimmed.length < limits.min) return message('contactSubjectShort');
  }
  if (name === 'mensagem') {
    if (!trimmed) return message('requiredMessage');
    if (trimmed.length < limits.min) return message('contactMessageMinChars', { min: limits.min });
  }
  return '';
}

export function validateContact(values: ContactValues, rules: FieldLimits): Partial<Record<ContactFieldName, string>> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([name]) => name in rules)
      .map(([name, value]) => [name, validateField(name, value, rules[name as ContactFieldName])])
      .filter(([, errorMessage]) => errorMessage)
  ) as Partial<Record<ContactFieldName, string>>;
}
