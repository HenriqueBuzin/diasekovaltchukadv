interface Window {
  gtag?: (...args: unknown[]) => void;
  onTurnstileOk?: (token: string) => void;
  onTurnstileExpired?: () => void;
  onTurnstileError?: () => void;
}
