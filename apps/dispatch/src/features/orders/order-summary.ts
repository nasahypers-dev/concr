import type { SlumpClass } from '@concr/shared';
import { formatVolume } from '@/lib/format';

/** "M300 · 12 m³ · P3" — the one-line product description used on cards and tables. */
export function orderSummary(grade: string, volumeM3: number, slump: SlumpClass | null): string {
  const base = `${grade} · ${formatVolume(volumeM3)}`;
  return slump ? `${base} · ${slump}` : base;
}
