/** Pull a CRM reset token out of a pasted URL or raw code. */
export function extractResetToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const fromQuery =
      url.searchParams.get('token') ||
      url.searchParams.get('resetToken') ||
      url.searchParams.get('reset_token');
    if (fromQuery?.trim()) return fromQuery.trim();

    const parts = url.pathname.split('/').filter(Boolean);
    const marker = parts.findIndex((part) => /reset/i.test(part));
    if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
    return parts[parts.length - 1] ?? trimmed;
  } catch {
    return trimmed;
  }
}
