export function onlyDigits(value: unknown): string {
  return String(value).replace(/\D/g, '');
}

export function formatPhoneBR(value: unknown): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPhoneDisplay(value: unknown): string {
  const original = String(value);
  let digits = onlyDigits(original);
  if (digits.startsWith('55')) digits = digits.slice(2);
  return digits.length < 10 ? original : formatPhoneBR(digits);
}
