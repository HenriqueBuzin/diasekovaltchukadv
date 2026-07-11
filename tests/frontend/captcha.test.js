import { afterEach, describe, expect, it, vi } from 'vitest';


async function initialize(markup) {
  document.body.innerHTML = markup;
  if (!window.onTurnstileOk) await import('../../src/static/js/captcha.js');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Turnstile callbacks', () => {
  it('enables, expires and disables the submit button', async () => {
    await initialize('<button id="submitBtn" disabled>Enviar</button>');
    const button = document.querySelector('#submitBtn');

    window.onTurnstileOk();
    expect(button.disabled).toBe(false);
    window.onTurnstileExpired();
    expect(button.disabled).toBe(true);
    window.onTurnstileOk();
    window.onTurnstileError();
    expect(button.disabled).toBe(true);
  });

  it('tolerates pages without the submit button', async () => {
    await initialize('');
    expect(() => window.onTurnstileOk()).not.toThrow();
    expect(() => window.onTurnstileExpired()).not.toThrow();
    expect(() => window.onTurnstileError()).not.toThrow();
  });
});
