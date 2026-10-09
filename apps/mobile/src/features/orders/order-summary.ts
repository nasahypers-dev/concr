import type { SlumpClass } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { formatPhoneAz, formatVolume } from '@/lib/format';

/** "M300 · 10 m³ · P3", or without the slump when the customer left it to the dispatcher. */
export function useOrderSummary(): (
  grade: string,
  volumeM3: number,
  slump: SlumpClass | null,
) => string {
  const { t } = useTranslation();
  return (grade, volumeM3, slump) =>
    slump
      ? t('order.summaryWithSlump', { grade, volume: formatVolume(volumeM3), slump })
      : t('order.summary', { grade, volume: formatVolume(volumeM3) });
}

export interface SiteContactLines {
  title: string;
  subtitle?: string;
}

/** Name on the first line with the phone under it; just the phone when no name was given. */
export function siteContactLines(name: string | null, phone: string): SiteContactLines {
  const formatted = formatPhoneAz(phone);
  return name ? { title: name, subtitle: formatted } : { title: formatted };
}
