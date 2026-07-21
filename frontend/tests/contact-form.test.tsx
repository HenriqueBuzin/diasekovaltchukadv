import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireContactConversion } from '../src/analytics';
import { sendContact } from '../src/api';
import { ContactForm } from '../src/components/ContactForm';
import type { ContactResponse } from '../src/types';
import { siteConfig } from './helpers';

vi.mock('../src/api', () => ({ loadSiteConfig: vi.fn(), sendContact: vi.fn() }));
vi.mock('../src/analytics', () => ({ fireContactConversion: vi.fn(), openWhatsApp: vi.fn() }));

function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid() {
  change('Nome', 'Pessoa da Silva');
  change('Telefone', '48999999999');
  change('Email', 'pessoa@example.com');
  change('Assunto', 'Orientação jurídica');
  change('Resumo do caso', 'Gostaria de entender os próximos passos do meu caso.');
}

describe('contact form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    delete window.turnstile;
  });

  it('shows all validation errors, focuses the first and clears an active error', () => {
    render(<ContactForm config={siteConfig} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
    expect(screen.getByLabelText('Nome')).toHaveFocus();
    expect(screen.getByText('Informe seu nome.')).toBeVisible();
    expect(screen.getByText('Informe seu telefone.')).toBeVisible();
    expect(screen.getByText('Informe seu e-mail.')).toBeVisible();
    expect(screen.getByText('Informe o assunto.')).toBeVisible();
    expect(screen.getByText('Escreva um resumo do caso.')).toBeVisible();

    change('Nome', 'Alice');
    expect(screen.queryByText('Informe seu nome.')).not.toBeInTheDocument();
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('validates on blur and formats the telephone', () => {
    render(<ContactForm config={siteConfig} />);
    change('Nome', 'Al');
    fireEvent.blur(screen.getByLabelText('Nome'));
    expect(screen.getByText('Informe pelo menos 3 caracteres.')).toBeVisible();
    change('Telefone', '48999999999');
    expect(screen.getByLabelText('Telefone')).toHaveValue('(48) 99999-9999');
  });

  it('submits, tracks conversion, resets and closes the success alert', async () => {
    let resolveRequest!: (response: ContactResponse) => void;
    vi.mocked(sendContact).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    render(<ContactForm config={siteConfig} />);
    fillValid();
    fireEvent.change(document.querySelector('#website')!, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled();

    await act(async () => resolveRequest({ message: 'Mensagem enviada com sucesso!', conversion: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mensagem enviada com sucesso!');
    expect(fireContactConversion).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Nome')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('supports a success without conversion and an API failure', async () => {
    vi.mocked(sendContact)
      .mockResolvedValueOnce({ message: 'Enviado', conversion: false })
      .mockRejectedValueOnce(new Error('Falha segura'));
    const { rerender } = render(<ContactForm config={siteConfig} />);
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
    await screen.findByText('Enviado');
    expect(fireContactConversion).not.toHaveBeenCalled();

    rerender(<ContactForm config={{ ...siteConfig, contactEmail: 'outro@example.com' }} />);
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para análise' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Falha segura'));
  });

  it('requires a CAPTCHA token when captcha is enabled and sends provider metadata', async () => {
    vi.mocked(sendContact).mockResolvedValue({ message: 'Enviado', conversion: false });
    let solveCaptcha!: (token: string) => void;
    const config = {
      ...siteConfig,
      captchaEnabled: true,
      captchaProviders: [{ name: 'turnstile' as const, siteKey: 'site-key' }]
    };
    window.turnstile = {
      render: vi.fn((_container, options) => {
        solveCaptcha = options.callback as (token: string) => void;
        return 'widget-id';
      })
    };

    render(<ContactForm config={config} />);
    fillValid();
    const button = screen.getByRole('button', { name: 'Enviar para análise' });
    expect(button).toBeDisabled();
    act(() => solveCaptcha('token'));
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await screen.findByText('Enviado');
    expect(sendContact).toHaveBeenCalledWith(
      expect.objectContaining({ captchaProvider: 'turnstile', captchaToken: 'token' })
    );
  });
});
