import type { Language } from '../db/db';

const AR_LATIN_DIGITS = 'ar-EG-u-nu-latn';

export function formatDateTime(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'ar' ? AR_LATIN_DIGITS : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(iso: string, language: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const locale = language === 'ar' ? AR_LATIN_DIGITS : 'en-GB';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** "2h 15m" from an ISO timestamp, updating with the provided `now`. */
export function elapsedLabel(iso: string | null, now: Date): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const diff = Math.max(0, now.getTime() - then.getTime());
  const minutes = Math.floor(diff / 60_000);
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const rest = minutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (days === 0 && (rest > 0 || parts.length === 0)) parts.push(`${rest}m`);
  return parts.join(' ');
}
