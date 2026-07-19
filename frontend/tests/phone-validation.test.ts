import { describe, expect, it } from 'vitest';

import { formatPhoneBR, formatPhoneDisplay, onlyDigits } from '../src/phone';
import { validateContact, validateField } from '../src/validation';
import { siteConfig } from './helpers';

describe('phone formatting', () => {
  it('formats every supported phone length', () => {
    expect(onlyDigits('+55 (48) 9')).toBe('55489');
    expect(formatPhoneBR('')).toBe('');
    expect(formatPhoneBR('4')).toBe('(4');
    expect(formatPhoneBR('4899')).toBe('(48) 99');
    expect(formatPhoneBR('4899999999')).toBe('(48) 9999-9999');
    expect(formatPhoneBR('48999999999')).toBe('(48) 99999-9999');
    expect(formatPhoneBR('489999999999')).toBe('(48) 99999-9999');
    expect(formatPhoneDisplay('123')).toBe('123');
    expect(formatPhoneDisplay('5548999999999')).toBe('(48) 99999-9999');
    expect(formatPhoneDisplay('4833334444')).toBe('(48) 3333-4444');
  });
});

describe('contact validation', () => {
  const rules = siteConfig.fieldLimits;

  it('returns required, length and format errors', () => {
    expect(validateField('nome', '', rules.nome)).toBe('Informe seu nome.');
    expect(validateField('nome', 'Al', rules.nome)).toContain('3');
    expect(validateField('email', '', rules.email)).toBe('Informe seu e-mail.');
    expect(validateField('email', 'invalid', rules.email)).toContain('válido');
    expect(validateField('telefone', '', rules.telefone)).toBe('Informe seu telefone.');
    expect(validateField('telefone', '123', rules.telefone)).toContain('10 ou 11');
    expect(validateField('assunto', '', rules.assunto)).toBe('Informe o assunto.');
    expect(validateField('assunto', 'Oi', rules.assunto)).toContain('melhor');
    expect(validateField('mensagem', '', rules.mensagem)).toBe('Escreva um resumo do caso.');
    expect(validateField('mensagem', 'curta', rules.mensagem)).toContain('10');
  });

  it('accepts valid and unknown fields and builds the error map', () => {
    expect(validateField('nome', 'Alice', rules.nome)).toBe('');
    expect(validateField('email', 'alice@example.com', rules.email)).toBe('');
    expect(validateField('telefone', '48999999999', rules.telefone)).toBe('');
    expect(validateField('assunto', 'Caso', rules.assunto)).toBe('');
    expect(validateField('mensagem', 'Mensagem válida', rules.mensagem)).toBe('');
    expect(validateField('unknown', 'anything', { min: 0, max: 1 })).toBe('');

    expect(
      validateContact(
        {
          nome: '',
          email: 'alice@example.com',
          telefone: '48999999999',
          assunto: 'Caso',
          mensagem: 'Mensagem válida',
          website: ''
        },
        rules
      )
    ).toEqual({ nome: 'Informe seu nome.' });
  });
});
