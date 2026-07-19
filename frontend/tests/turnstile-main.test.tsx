import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Turnstile } from '../src/components/Turnstile';

describe('Turnstile component', () => {
  afterEach(() => {
    document.getElementById('cloudflare-turnstile-script')?.remove();
  });

  it('renders nothing when disabled', () => {
    const { container } = render(<Turnstile enabled={false} siteKey="" onToken={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('creates the script, exposes callbacks, reuses the script and cleans callbacks', () => {
    const onToken = vi.fn();
    const first = render(<Turnstile enabled siteKey="site-key" onToken={onToken} />);
    expect(document.getElementById('cloudflare-turnstile-script')).toHaveAttribute(
      'src',
      'https://challenges.cloudflare.com/turnstile/v0/api.js'
    );
    expect(document.querySelector('.cf-turnstile')).toHaveAttribute('data-sitekey', 'site-key');
    window.onTurnstileOk?.('token');
    window.onTurnstileExpired?.();
    window.onTurnstileError?.();
    expect(onToken.mock.calls).toEqual([['token'], [''], ['']]);
    first.unmount();
    expect(window.onTurnstileOk).toBeUndefined();

    const existing = document.getElementById('cloudflare-turnstile-script');
    render(<Turnstile enabled siteKey="other-key" onToken={onToken} />);
    expect(document.getElementById('cloudflare-turnstile-script')).toBe(existing);
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
