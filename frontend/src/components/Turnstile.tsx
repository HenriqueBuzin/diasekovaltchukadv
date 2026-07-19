import { useEffect } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';

interface TurnstileProps {
  enabled: boolean;
  siteKey: string;
  onToken: (token: string) => void;
}

export function Turnstile({ enabled, siteKey, onToken }: TurnstileProps) {
  useEffect(() => {
    if (!enabled) return undefined;

    window.onTurnstileOk = onToken;
    window.onTurnstileExpired = () => onToken('');
    window.onTurnstileError = () => onToken('');

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.append(script);
    }

    return () => {
      delete window.onTurnstileOk;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, [enabled, onToken]);

  if (!enabled) return null;
  return (
    <div className="turnstile-wrap">
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="auto"
        data-callback="onTurnstileOk"
        data-expired-callback="onTurnstileExpired"
        data-error-callback="onTurnstileError"
      />
    </div>
  );
}
