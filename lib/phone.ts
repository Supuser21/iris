/** Normalize to E.164. US: 4155550123, (415) 555-0123, 1-415-555-0123 → +14155550123 */
export function normalizePhone(phone: string): string {
  const digits = phone.trim().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.trim().startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

export function isValidUsPhone(phone: string): boolean {
  const digits = phone.trim().replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/** Display only — e.g. +14155550123 → (415) 555-0123 */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits.length === 10
        ? digits
        : null;
  if (!ten) return phone;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}
