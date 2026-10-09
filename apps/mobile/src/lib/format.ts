import {
  BAKU_UTC_OFFSET_MINUTES,
  type IsoDate,
  type IsoDateTime,
  type TimeOfDay,
} from '@concr/shared';

/**
 * Date/time display helpers. Everything is shown in the supplier's local time (Baku, UTC+4, no
 * DST) and formatted by hand so the output is identical on Hermes, JSC and in Jest.
 */

function bakuParts(date: Date): { y: number; m: number; d: number; hh: number; mm: number } {
  const shifted = new Date(date.getTime() + BAKU_UTC_OFFSET_MINUTES * 60_000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
  };
}

/** Non-breaking space between a number and its unit. */
const NBSP = ' ';

const two = (n: number): string => n.toString().padStart(2, '0');

/** "09.10.2026" */
export function formatDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
  const { y, m, d } = bakuParts(new Date(iso));
  return `${two(d)}.${two(m)}.${y}`;
}

/** "12:30" */
export function formatTime(iso: IsoDateTime): string {
  const { hh, mm } = bakuParts(new Date(iso));
  return `${two(hh)}:${two(mm)}`;
}

/** "09.10.2026, 12:30" */
export function formatDateTime(iso: IsoDateTime): string {
  return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/** "08:00–10:00" */
export function formatWindow(start: TimeOfDay, end: TimeOfDay): string {
  return `${start}–${end}`;
}

/** Today's Baku date as "YYYY-MM-DD" plus an offset in days. */
export function todayIsoDate(now: Date = new Date(), dayOffset = 0): IsoDate {
  const { y, m, d } = bakuParts(new Date(now.getTime() + dayOffset * 86_400_000));
  return `${y}-${two(m)}-${two(d)}`;
}

/** Days from today's Baku date to `date` (0 = today, 1 = tomorrow, -1 = yesterday). */
export function dayOffsetFromToday(date: IsoDate, now: Date = new Date()): number {
  const target = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  );
  const today = todayIsoDate(now);
  const base = Date.UTC(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
    Number(today.slice(8, 10)),
  );
  return Math.round((target - base) / 86_400_000);
}

/** "12 m³" with a thin space; volumes keep up to two decimals without trailing zeros. */
export function formatVolume(volumeM3: number): string {
  const text = Number.isInteger(volumeM3)
    ? String(volumeM3)
    : volumeM3.toFixed(2).replace(/\.?0+$/, '');
  return `${text.replace('.', ',')}${NBSP}m³`;
}

/** "18 dəq" style helper is i18n-bound; this only clamps the number. */
export function clampEta(minutes: number | null | undefined): number | null {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null;
  return Math.max(0, Math.round(minutes));
}

/** "+994503260343" → "+994 50 326 03 43"; other lengths are returned grouped loosely. */
export function formatPhoneAz(phone: string): string {
  const match = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (match) return `+994 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  return phone.replace(/(\d{3})(?=\d)/g, '$1 ');
}
