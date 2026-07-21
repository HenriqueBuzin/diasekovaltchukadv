interface Window {
  gtag?: (...args: unknown[]) => void;
  __captchaLoaded_turnstile?: () => void;
  __captchaLoaded_recaptcha?: () => void;
  __captchaLoaded_hcaptcha?: () => void;
  turnstile?: CaptchaWidgetApi;
  grecaptcha?: CaptchaWidgetApi;
  hcaptcha?: CaptchaWidgetApi;
}

interface CaptchaWidgetApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string | number;
  reset?: (widgetId?: string | number) => void;
  remove?: (widgetId?: string | number) => void;
}
