import { type ChangeEvent, type FormEvent, type HTMLAttributes, useCallback, useState } from 'react';

import { fireContactConversion } from '../analytics';
import { sendContact } from '../api';
import { formatPhoneBR } from '../phone';
import type { ContactFieldName, ContactValues, FieldLimit, SiteConfig } from '../types';
import { validateContact, validateField } from '../validation';
import { Turnstile } from './Turnstile';

const EMPTY_FORM: ContactValues = { nome: '', telefone: '', email: '', assunto: '', mensagem: '', website: '' };

interface FieldProps {
  as?: 'input' | 'textarea';
  id: string;
  label: string;
  name: ContactFieldName;
  value: string;
  error: string | undefined;
  limits: FieldLimit;
  onBlur: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}

function Field({
  as = 'input',
  id,
  label,
  name,
  value,
  error,
  limits,
  onBlur,
  onChange,
  type,
  placeholder,
  autoComplete,
  inputMode
}: FieldProps) {
  const commonProps = {
    className: `form-control${error ? ' is-invalid' : ''}`,
    id,
    name,
    value,
    minLength: limits.min,
    maxLength: limits.max,
    'aria-describedby': `${id}-error`,
    'aria-invalid': Boolean(error),
    onBlur,
    onChange,
    placeholder,
    required: true
  };

  return (
    <div className="form-floating">
      {as === 'textarea' ? (
        <textarea {...commonProps} />
      ) : (
        <input {...commonProps} type={type} autoComplete={autoComplete} inputMode={inputMode} />
      )}
      <label htmlFor={id}>{label}</label>
      <div className="field-error" id={`${id}-error`} aria-live="polite">
        {error}
      </div>
    </div>
  );
}

interface ContactFormProps {
  config: SiteConfig;
}

type FormStatus = { type: 'success' | 'danger'; message: string };

export function ContactForm({ config }: ContactFormProps) {
  const [values, setValues] = useState<ContactValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<ContactFieldName, string>>>({});
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [sending, setSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const setToken = useCallback((token: string) => setCaptchaToken(token), []);

  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as keyof ContactValues;
    const value = name === 'telefone' ? formatPhoneBR(event.target.value) : event.target.value;
    setValues((current) => ({ ...current, [name]: value }));
    if (name !== 'website' && errors[name]) {
      setErrors((current) => ({ ...current, [name]: validateField(name, value, config.fieldLimits[name]) }));
    }
  };

  const blur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as ContactFieldName;
    const { value } = event.target;
    setErrors((current) => ({ ...current, [name]: validateField(name, value, config.fieldLimits[name]) }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateContact(values, config.fieldLimits);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      (event.currentTarget.elements.namedItem(firstInvalid) as HTMLElement).focus();
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      const response = await sendContact({ ...values, captchaToken });
      if (response.conversion) fireContactConversion();
      setStatus({ type: 'success', message: response.message });
      setValues(EMPTY_FORM);
      setCaptchaToken('');
    } catch (error: unknown) {
      setStatus({ type: 'danger', message: (error as Error).message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="form-panel">
      {status && (
        <div className={`alert alert-${status.type} alert-dismissible fade show`} role="alert">
          {status.message}
          <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setStatus(null)} />
        </div>
      )}
      <form className="contact-form" noValidate onSubmit={submit}>
        <div className="field-grid">
          <Field
            id="name"
            label="Nome"
            name="nome"
            type="text"
            placeholder="Fulano da Silva"
            autoComplete="name"
            value={values.nome}
            error={errors.nome}
            limits={config.fieldLimits.nome}
            onBlur={blur}
            onChange={change}
          />
          <Field
            id="tel"
            label="Telefone"
            name="telefone"
            type="tel"
            placeholder="(48) 99999-9999"
            autoComplete="tel"
            inputMode="tel"
            value={values.telefone}
            error={errors.telefone}
            limits={config.fieldLimits.telefone}
            onBlur={blur}
            onChange={change}
          />
        </div>
        <Field
          id="email"
          label="Email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          value={values.email}
          error={errors.email}
          limits={config.fieldLimits.email}
          onBlur={blur}
          onChange={change}
        />
        <Field
          id="subject"
          label="Assunto"
          name="assunto"
          type="text"
          placeholder="Assunto"
          value={values.assunto}
          error={errors.assunto}
          limits={config.fieldLimits.assunto}
          onBlur={blur}
          onChange={change}
        />
        <Field
          as="textarea"
          id="message"
          label="Resumo do caso"
          name="mensagem"
          placeholder="Mensagem"
          value={values.mensagem}
          error={errors.mensagem}
          limits={config.fieldLimits.mensagem}
          onBlur={blur}
          onChange={change}
        />
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="website">Seu site</label>
          <input
            type="text"
            name="website"
            id="website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={change}
          />
        </div>
        <Turnstile enabled={config.captchaEnabled} siteKey={config.turnstileSiteKey} onToken={setToken} />
        <button
          type="submit"
          id="submitBtn"
          className="send-button"
          disabled={sending || (config.captchaEnabled && !captchaToken)}
        >
          {sending ? 'Enviando...' : 'Enviar para análise'} <i className="bi bi-send" />
        </button>
      </form>
    </div>
  );
}
