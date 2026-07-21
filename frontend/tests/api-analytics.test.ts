import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fireContactConversion, openWhatsApp } from '../src/analytics';
import { loadSiteConfig, sendContact } from '../src/api';

describe('API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads configuration and sends JSON contact data', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ contactEmail: 'a@b.co' }) })
      .mockResolvedValueOnce({ ok: true, json: vi.fn().mockResolvedValue({ conversion: true }) });
    vi.stubGlobal('fetch', fetch);

    await expect(loadSiteConfig()).resolves.toEqual({ contactEmail: 'a@b.co' });
    await expect(sendContact({ nome: 'Ana' })).resolves.toEqual({ conversion: true });
    const requestOptions = fetch.mock.calls[1]![1] as RequestInit;
    expect(requestOptions).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' } });
    expect(requestOptions.body).toBe('{"nome":"Ana"}');
  });

  it('uses API and fallback error messages', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({ message: 'Falhou' }) })
      .mockResolvedValueOnce({ ok: false, json: vi.fn().mockResolvedValue({}) });
    vi.stubGlobal('fetch', fetch);
    await expect(loadSiteConfig()).rejects.toThrow('Falhou');
    await expect(sendContact({})).rejects.toThrow('Não foi possível concluir');
  });
});

describe('analytics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('open', vi.fn());
    delete window.gtag;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens WhatsApp directly and keeps the timeout idempotent', () => {
    openWhatsApp('https://wa.me/1');
    vi.advanceTimersByTime(800);
    expect(window.open).toHaveBeenCalledOnce();
  });

  it('tracks WhatsApp and contact conversions', () => {
    window.gtag = vi.fn((...args: unknown[]) => {
      const options = args[2] as { event_callback?: () => void };
      options.event_callback?.();
    });
    openWhatsApp('https://wa.me/2');
    vi.advanceTimersByTime(800);
    fireContactConversion();
    expect(window.open).toHaveBeenCalledOnce();
    expect(window.gtag).toHaveBeenCalledTimes(2);
  });

  it('does not track a contact conversion without gtag', () => {
    expect(fireContactConversion()).toBeUndefined();
  });
});
