import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { activeCaptchaProviders } from '../src/captchaProviders';
import { CaptchaChallenge } from '../src/components/CaptchaChallenge';

describe('CaptchaChallenge component', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.getElementById('cloudflare-turnstile-script')?.remove();
    document.getElementById('google-recaptcha-script')?.remove();
    document.getElementById('hcaptcha-script')?.remove();
    delete window.turnstile;
    delete window.grecaptcha;
    delete window.hcaptcha;
  });

  it('renders nothing when disabled and creates a legacy Turnstile provider', () => {
    const { container } = render(<CaptchaChallenge enabled={false} providers={[]} onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(activeCaptchaProviders(true, [], 'site-key')).toEqual([{ name: 'turnstile', siteKey: 'site-key' }]);
    expect(activeCaptchaProviders(true, [], '')).toEqual([]);
  });

  it('creates the active provider script, renders the widget and cleans callbacks', () => {
    const onChange = vi.fn();
    window.turnstile = {
      render: vi.fn((_container, options) => {
        (options.callback as (token: string) => void)('token');
        (options['expired-callback'] as () => void)();
        (options['error-callback'] as () => void)();
        return 'widget-id';
      }),
      remove: vi.fn()
    };
    const view = render(
      <CaptchaChallenge enabled providers={[{ name: 'turnstile', siteKey: 'site-key' }]} onChange={onChange} />
    );

    expect(window.turnstile.render).toHaveBeenCalledOnce();
    expect(onChange.mock.calls).toContainEqual([{ provider: 'turnstile', token: 'token' }]);
    expect(onChange.mock.calls).toContainEqual([{ provider: '', token: '' }]);
    act(() => window.__captchaLoaded_turnstile?.());
    expect(window.turnstile.render).toHaveBeenCalledOnce();
    view.unmount();
    expect(window.turnstile.remove).toHaveBeenCalledWith('widget-id');
    expect(window.__captchaLoaded_turnstile).toBeUndefined();
  });

  it('falls back to the next provider when the first script does not load', async () => {
    const onChange = vi.fn();
    render(
      <CaptchaChallenge
        enabled
        providers={[
          { name: 'turnstile', siteKey: 'turnstile-site' },
          { name: 'recaptcha', siteKey: 'recaptcha-site' }
        ]}
        onChange={onChange}
      />
    );
    const turnstileScript = document.getElementById('cloudflare-turnstile-script') as HTMLScriptElement;
    expect(turnstileScript).toBeInTheDocument();

    window.grecaptcha = {
      render: vi.fn((_container, options) => {
        (options.callback as (token: string) => void)('google-token');
        return 2;
      })
    };
    act(() => turnstileScript.onerror?.(new Event('error')));
    await waitFor(() => expect(window.grecaptcha?.render).toHaveBeenCalledOnce());
    expect(onChange).toHaveBeenLastCalledWith({ provider: 'recaptcha', token: 'google-token' });
  });

  it('ignores script failure callbacks after unmount and reuses existing scripts', () => {
    const onChange = vi.fn();
    const view = render(
      <CaptchaChallenge enabled providers={[{ name: 'turnstile', siteKey: 'turnstile-site' }]} onChange={onChange} />
    );
    const turnstileScript = document.getElementById('cloudflare-turnstile-script') as HTMLScriptElement;
    view.unmount();
    act(() => turnstileScript.onerror?.(new Event('error')));
    expect(onChange).toHaveBeenCalledTimes(1);

    render(
      <CaptchaChallenge enabled providers={[{ name: 'turnstile', siteKey: 'turnstile-site' }]} onChange={onChange} />
    );
    expect(document.querySelectorAll('#cloudflare-turnstile-script')).toHaveLength(1);
  });

  it('falls back through hCaptcha and stops at the last provider', async () => {
    render(
      <CaptchaChallenge
        enabled
        providers={[
          { name: 'recaptcha', siteKey: 'recaptcha-site' },
          { name: 'hcaptcha', siteKey: 'hcaptcha-site' }
        ]}
        onChange={vi.fn()}
      />
    );
    const recaptchaScript = document.getElementById('google-recaptcha-script') as HTMLScriptElement;
    expect(recaptchaScript).toBeInTheDocument();
    act(() => recaptchaScript.onerror?.(new Event('error')));
    await waitFor(() => expect(document.getElementById('hcaptcha-script')).toBeInTheDocument());
    const hcaptchaScript = document.getElementById('hcaptcha-script') as HTMLScriptElement;
    act(() => hcaptchaScript.onerror?.(new Event('error')));
    expect(document.getElementById('hcaptcha-script')).toBeInTheDocument();
  });

  it('renders hCaptcha options and fails over when onload fires without an API', async () => {
    const onChange = vi.fn();
    window.hcaptcha = {
      render: vi.fn((_container, options) => {
        (options.callback as (token: string) => void)('hcaptcha-token');
        return 'hcaptcha-widget';
      })
    };
    render(
      <CaptchaChallenge enabled providers={[{ name: 'hcaptcha', siteKey: 'hcaptcha-site' }]} onChange={onChange} />
    );
    expect(window.hcaptcha.render).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith({ provider: 'hcaptcha', token: 'hcaptcha-token' });

    delete window.hcaptcha;
    render(
      <CaptchaChallenge enabled providers={[{ name: 'hcaptcha', siteKey: 'hcaptcha-site' }]} onChange={onChange} />
    );
    act(() => window.__captchaLoaded_hcaptcha?.());
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith({ provider: '', token: '' }));
  });
});

describe('React entrypoint', () => {
  it('mounts the application into root', async () => {
    vi.resetModules();
    document.body.innerHTML = '<div id="root"></div>';
    const renderApp = vi.fn();
    const createRoot = vi.fn(() => ({ render: renderApp }));
    vi.doMock('react-dom/client', () => ({ createRoot }));
    await import('../src/main');
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(renderApp).toHaveBeenCalledOnce();
    vi.doUnmock('react-dom/client');
  });
});
