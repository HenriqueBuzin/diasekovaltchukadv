import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const modulePath = '../../src/static/js/mask.js';

function formMarkup() {
  return `
    <span data-phone="5548999999999"></span>
    <span data-phone="4833334444"></span>
    <span data-phone="123"></span>
    <a class="wa-track" href="https://wa.me/5548999999999">WhatsApp</a>
    <form>
      <input id="name"><div data-error-for="name"></div>
      <input id="email"><div data-error-for="email"></div>
      <input id="tel"><div data-error-for="tel"></div>
      <input id="subject"><div data-error-for="subject"></div>
      <textarea id="message"></textarea><div data-error-for="message"></div>
    </form>`;
}

async function initialize(markup = formMarkup()) {
  document.body.innerHTML = markup;
  if (!window.DKContact) await import(modulePath);
  window.DKContact.initContactPage();
}

function input(element, value, inputType = 'insertText') {
  element.value = value;
  element.setSelectionRange(value.length, value.length);
  const event = new InputEvent('input', { bubbles: true, inputType });
  element.dispatchEvent(event);
}

describe('contact form behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('open', vi.fn());
    delete window.gtag;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('formats displayed phone numbers and every input length', async () => {
    await initialize();
    expect(window.DKContact.formatPhoneBR('')).toBe('');
    expect(window.DKContact.formatPhoneDisplay('123')).toBe('123');
    const displays = document.querySelectorAll('[data-phone]');
    expect(displays[0].textContent).toBe('(48) 99999-9999');
    expect(displays[1].textContent).toBe('(48) 3333-4444');
    expect(displays[2].textContent).toBe('123');

    const tel = document.querySelector('#tel');
    input(tel, '4');
    expect(tel.value).toBe('(4');
    input(tel, '4899');
    expect(tel.value).toBe('(48) 99');
    input(tel, '4899999999');
    expect(tel.value).toBe('(48) 9999-9999');
    input(tel, '48999999999');
    expect(tel.value).toBe('(48) 99999-9999');
    input(tel, '489999999999');
    expect(tel.value).toBe('(48) 99999-9999');
    input(tel, '4899999999', 'deleteContentBackward');
    expect(tel.value).toBe('(48) 9999-9999');
    input(tel, '');
    expect(tel.value).toBe('');
  });

  it('shows required, length and format errors then clears them', async () => {
    await initialize();
    const form = document.querySelector('form');
    const fields = ['name', 'email', 'tel', 'subject', 'message'].map((id) => document.getElementById(id));

    const emptySubmit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(emptySubmit);
    expect(emptySubmit.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(fields[0]);
    expect(fields.every((field) => field.classList.contains('is-invalid'))).toBe(true);

    const querySelector = vi.spyOn(form, 'querySelector').mockReturnValue(null);
    const noFocusableSubmit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(noFocusableSubmit);
    expect(noFocusableSubmit.defaultPrevented).toBe(true);
    querySelector.mockRestore();

    fields[0].value = 'Al';
    fields[1].value = 'email-invalido';
    fields[2].value = '123';
    fields[3].value = 'Oi';
    fields[4].value = 'curta';
    fields.forEach((field) => field.dispatchEvent(new Event('blur')));
    expect(document.querySelector('[data-error-for="name"]').textContent).toContain('3 caracteres');
    expect(document.querySelector('[data-error-for="email"]').textContent).toContain('válido');
    expect(document.querySelector('[data-error-for="tel"]').textContent).toContain('10 ou 11');
    expect(document.querySelector('[data-error-for="subject"]').textContent).toContain('melhor');
    expect(document.querySelector('[data-error-for="message"]').textContent).toContain('10 caracteres');

    const validValues = ['Alice', 'alice@example.com', '(48) 99999-9999', 'Caso', 'Mensagem válida do caso'];
    fields.forEach((field, index) => {
      field.value = validValues[index];
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const validSubmit = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(validSubmit);
    expect(validSubmit.defaultPrevented).toBe(false);
    expect(fields.every((field) => field.getAttribute('aria-invalid') === 'false')).toBe(true);
  });

  it('handles a missing error element and a page without telephone input', async () => {
    await initialize('<form><input id="name"></form>');
    const name = document.querySelector('#name');
    name.dispatchEvent(new Event('blur'));
    expect(name.classList.contains('is-invalid')).toBe(true);

    const unknown = document.createElement('input');
    unknown.id = 'unknown';
    expect(window.DKContact.validateField(unknown)).toBe(true);
  });

  it('tracks WhatsApp with gtag and opens only once', async () => {
    const gtag = vi.fn((_event, _name, options) => options.event_callback());
    vi.stubGlobal('gtag', gtag);
    await initialize();

    document.querySelector('.wa-track').click();
    vi.advanceTimersByTime(800);

    expect(gtag).toHaveBeenCalledOnce();
    expect(window.open).toHaveBeenCalledOnce();
    expect(window.open).toHaveBeenCalledWith('https://wa.me/5548999999999', '_blank', 'noopener,noreferrer');
  });

  it('opens WhatsApp without gtag and keeps the fallback idempotent', async () => {
    await initialize();
    document.querySelector('.wa-track').click();
    vi.advanceTimersByTime(800);
    expect(window.open).toHaveBeenCalledOnce();
  });
});
