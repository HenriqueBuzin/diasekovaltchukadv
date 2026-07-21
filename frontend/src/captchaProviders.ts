import type { CaptchaProviderConfig } from './types';

export function activeCaptchaProviders(
  enabled: boolean,
  providers: CaptchaProviderConfig[],
  legacyTurnstileSiteKey = ''
): CaptchaProviderConfig[] {
  if (!enabled) return [];
  if (providers.length) return providers;
  return legacyTurnstileSiteKey ? [{ name: 'turnstile', siteKey: legacyTurnstileSiteKey }] : [];
}
