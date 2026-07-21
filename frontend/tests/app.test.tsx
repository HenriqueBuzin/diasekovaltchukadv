import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App, { Site } from '../src/App';
import { loadSiteConfig } from '../src/api';
import { Navigation } from '../src/components/Navigation';
import { siteConfig } from './helpers';

vi.mock('../src/api', () => ({ loadSiteConfig: vi.fn(), sendContact: vi.fn() }));

describe('application shell', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('open', vi.fn());
    delete window.gtag;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders every section, structured data and navigation interactions', () => {
    const { unmount } = render(<Site config={siteConfig} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Quando o problema é sério');
    expect(screen.getByText('Direito Criminal')).toBeVisible();
    expect(screen.getByText('Dra. Larissa de Souza Dias')).toBeVisible();
    expect(document.head.querySelector('[data-site-schema]')).toHaveTextContent('5548988026847');

    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const contact = screen.getByRole('link', { name: 'Contato' });
    const contactSection = document.querySelector<HTMLElement>('#contact')!;
    contactSection.scrollIntoView = vi.fn();
    fireEvent.click(contact);
    expect(contactSection.scrollIntoView).toHaveBeenCalledOnce();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('link', { name: 'Quero atendimento agora' }));
    vi.advanceTimersByTime(800);
    expect(window.open).toHaveBeenCalledWith('https://wa.me/5548988026847', '_blank', 'noopener,noreferrer');

    unmount();
    expect(document.head.querySelector('[data-site-schema]')).not.toBeInTheDocument();
  });

  it('allows a native anchor when its target is absent', () => {
    render(<Navigation whatsLinkNumber="1" />);
    const office = screen.getByRole('link', { name: 'Escritório' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    office.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('loads configuration before rendering the site', async () => {
    vi.mocked(loadSiteConfig).mockResolvedValue(siteConfig);
    render(<App />);
    expect(screen.getByText('Carregando...')).toBeVisible();
    expect(await screen.findByRole('heading', { level: 1 })).toBeVisible();
  });

  it('shows a configuration error', async () => {
    vi.mocked(loadSiteConfig).mockRejectedValue(new Error('Configuração indisponível'));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Configuração indisponível'));
  });
});
