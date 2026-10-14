import {
  BAKU_UTC_OFFSET_MINUTES,
  formatAzn,
  type IsoDate,
  type IsoDateTime,
  type MoneyString,
  type TimeOfDay,
  windowStartToDate,
} from '@concr/shared';

/**
 * Date/time display helpers. Everything is shown in the supplier's local time (Baku, UTC+4, no
 * DST) and formatted by hand so the output is identical in the browser, on the server and in Jest.
 * Mirrors apps/mobile/src/lib/format.ts.
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
const NBSP = ' ';

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

/** "12 m³"; volumes keep up to two decimals without trailing zeros. */
export function formatVolume(volumeM3: number): string {
  const text = Number.isInteger(volumeM3)
    ? String(volumeM3)
    : volumeM3.toFixed(2).replace(/\.?0+$/, '');
  return `${text.replace('.', ',')}${NBSP}m³`;
}

/** "1 298,00 ₼" */
export function formatMoney(amount: MoneyString): string {
  return formatAzn(amount);
}

/** "+994503260343" → "+994 50 326 03 43"; other lengths are returned grouped loosely. */
export function formatPhoneAz(phone: string): string {
  const match = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (match) return `+994 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  return phone.replace(/(\d{3})(?=\d)/g, '$1 ');
}

/** Whole minutes from `iso` to `now` (never negative). */
export function minutesSince(iso: IsoDateTime, now: Date = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60_000));
}

/** Minutes since Baku midnight of the same local day (board placement). */
export function bakuMinutesOfDay(iso: IsoDateTime): number {
  const { hh, mm } = bakuParts(new Date(iso));
  return hh * 60 + mm;
}

/** ISO timestamp → "YYYY-MM-DDTHH:mm" in Baku time for `<input type="datetime-local">`. */
export function toBakuLocalInput(iso: IsoDateTime): string {
  const { y, m, d, hh, mm } = bakuParts(new Date(iso));
  return `${y}-${two(m)}-${two(d)}T${two(hh)}:${two(mm)}`;
}

/** "YYYY-MM-DDTHH:mm" typed in Baku time → ISO UTC; `null` when the value is incomplete. */
export function fromBakuLocalInput(value: string): IsoDateTime | null {
  const [date, time] = value.split('T');
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }
  try {
    return windowStartToDate(date, time).toISOString();
  } catch {
    return null;
  }
}

/** "12.5" / "12,5" typed in a price field → "12.50"; `null` when it is not a number. */
export function toMoneyString(value: string): MoneyString | null {
  const normalised = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return null;
  return Number(normalised).toFixed(2);
}
