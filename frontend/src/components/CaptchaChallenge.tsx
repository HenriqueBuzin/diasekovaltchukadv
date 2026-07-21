import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { activeCaptchaProviders } from '../captchaProviders';
import type { CaptchaProviderConfig, CaptchaProviderName } from '../types';

const SCRIPT_TIMEOUT_MS = 6000;

type CaptchaValue = { provider: CaptchaProviderName | ''; token: string };

interface CaptchaDefinition {
  apiName: 'turnstile' | 'grecaptcha' | 'hcaptcha';
  className: string;
  scriptId: string;
  scriptSrc: string;
  widgetOptions: (provider: CaptchaProviderConfig, solved: (token: string) => void, cleared: () => void) => object;
}

const CAPTCHA_DEFINITIONS: Record<CaptchaProviderName, CaptchaDefinition> = {
  turnstile: {
    apiName: 'turnstile',
    className: 'cf-turnstile',
    scriptId: 'cloudflare-turnstile-script',
    scriptSrc: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__captchaLoaded_turnstile',
    widgetOptions: (provider, solved, cleared) => ({
      sitekey: provider.siteKey,
      theme: 'auto',
      callback: solved,
      'expired-callback': cleared,
      'error-callback': cleared
    })
  },
  recaptcha: {
    apiName: 'grecaptcha',
    className: 'g-recaptcha',
    scriptId: 'google-recaptcha-script',
    scriptSrc: 'https://www.google.com/recaptcha/api.js?render=explicit&onload=__captchaLoaded_recaptcha',
    widgetOptions: (provider, solved, cleared) => ({
      sitekey: provider.siteKey,
      theme: 'dark',
      callback: solved,
      'expired-callback': cleared,
      'error-callback': cleared
    })
  },
  hcaptcha: {
    apiName: 'hcaptcha',
    className: 'h-captcha',
    scriptId: 'hcaptcha-script',
    scriptSrc: 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__captchaLoaded_hcaptcha',
    widgetOptions: (provider, solved, cleared) => ({
      sitekey: provider.siteKey,
      theme: 'dark',
      callback: solved,
      'expired-callback': cleared,
      'error-callback': cleared
    })
  }
};

interface CaptchaChallengeProps {
  enabled: boolean;
  providers: CaptchaProviderConfig[];
  legacyTurnstileSiteKey?: string;
  onChange: (value: CaptchaValue) => void;
}

export function CaptchaChallenge({ enabled, providers, legacyTurnstileSiteKey = '', onChange }: CaptchaChallengeProps) {
  const availableProviders = useMemo(
    () => activeCaptchaProviders(enabled, providers, legacyTurnstileSiteKey),
    [enabled, providers, legacyTurnstileSiteKey]
  );
  const providersKey = useMemo(
    () => availableProviders.map((provider) => `${provider.name}:${provider.siteKey}`).join('|'),
    [availableProviders]
  );
  const [activeSelection, setActiveSelection] = useState({ key: '', index: 0 });
  const activeIndex = activeSelection.key === providersKey ? activeSelection.index : 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const clearToken = useCallback(() => onChange({ provider: '', token: '' }), [onChange]);

  useEffect(() => {
    clearToken();
  }, [providersKey, clearToken]);

  useEffect(() => {
    const provider = availableProviders[activeIndex];
    const container = containerRef.current;
    if (!provider || !container) return undefined;

    const definition = CAPTCHA_DEFINITIONS[provider.name];
    let widgetId: string | number | undefined;
    let loaded = false;
    let cancelled = false;
    container.innerHTML = '';

    const failover = () => {
      if (cancelled) return;
      clearToken();
      setActiveSelection((current) => {
        const currentIndex = current.key === providersKey ? current.index : activeIndex;
        return {
          key: providersKey,
          index: currentIndex + 1 < availableProviders.length ? currentIndex + 1 : currentIndex
        };
      });
    };

    const solved = (token: string) => onChange({ provider: provider.name, token });
    const renderWidget = () => {
      if (cancelled || loaded) return;
      const api = window[definition.apiName];
      if (!api?.render || !containerRef.current) {
        failover();
        return;
      }
      loaded = true;
      widgetId = api.render(
        containerRef.current,
        definition.widgetOptions(provider, solved, clearToken) as Record<string, unknown>
      );
    };

    window[`__captchaLoaded_${provider.name}`] = renderWidget;
    const timeoutId = window.setTimeout(failover, SCRIPT_TIMEOUT_MS);
    const existingScript = document.getElementById(definition.scriptId) as HTMLScriptElement | null;

    if (window[definition.apiName]?.render) {
      renderWidget();
    } else if (!existingScript) {
      const script = document.createElement('script');
      script.id = definition.scriptId;
      script.src = definition.scriptSrc;
      script.async = true;
      script.defer = true;
      script.onerror = failover;
      document.head.append(script);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window[definition.apiName]?.remove?.(widgetId);
      delete window[`__captchaLoaded_${provider.name}`];
    };
  }, [activeIndex, availableProviders, clearToken, onChange, providersKey]);

  if (!enabled || !availableProviders.length) return null;

  const provider = availableProviders[activeIndex]!;

  return (
    <div className="turnstile-wrap">
      <div ref={containerRef} className={CAPTCHA_DEFINITIONS[provider.name].className} />
    </div>
  );
}
