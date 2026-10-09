import type { IsoDate, IsoDateTime, TimeOfDay } from '../domain/common';
import { BAKU_UTC_OFFSET_MINUTES, windowStartToDate } from '../state-machines/order-state.machine';

/** Calendar date of `now` in Baku local time, shifted by `dayOffset` days. */
export function bakuDate(now: Date, dayOffset = 0): IsoDate {
  const shifted = new Date(
    now.getTime() + BAKU_UTC_OFFSET_MINUTES * 60_000 + dayOffset * 86_400_000,
  );
  const y = shifted.getUTCFullYear();
  const m = (shifted.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = shifted.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Baku local "HH:mm" on the day `now + dayOffset` as an absolute ISO timestamp. */
export function bakuTime(now: Date, dayOffset: number, time: TimeOfDay): IsoDateTime {
  return windowStartToDate(bakuDate(now, dayOffset), time).toISOString();
}

export function minutesFromNow(now: Date, minutes: number): IsoDateTime {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

export function minutesAgo(now: Date, minutes: number): IsoDateTime {
  return minutesFromNow(now, -minutes);
}

/** Current Baku local "HH:mm" rounded down to the hour, plus an offset in hours (window slots). */
export function bakuHourSlot(now: Date, hourOffset: number): TimeOfDay {
  const shifted = new Date(now.getTime() + BAKU_UTC_OFFSET_MINUTES * 60_000);
  const hour = (shifted.getUTCHours() + hourOffset + 24) % 24;
  return `${hour.toString().padStart(2, '0')}:00`;
}
