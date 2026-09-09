/**
 * ORBI CRM media lives on S3 under type-specific prefixes (same as the web app):
 * - VIDEO → `videos/<filename>`
 * - PDF / IMAGE / other → `uploads/<filename>`
 * - coursework attachments → `coursework/<filename>` (see coursework.ts)
 */
const S3_BASE = 'https://orbierp-s3-bucket.s3.eu-west-2.amazonaws.com';

export function crmCourseMediaUrl(key: string, type: string): string {
  const raw = key.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  const folder = type.trim().toUpperCase() === 'VIDEO' ? 'videos' : 'uploads';
  return `${S3_BASE}/${folder}/${encodeURIComponent(raw)}`;
}
