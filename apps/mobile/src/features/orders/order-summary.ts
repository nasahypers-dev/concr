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

/** "Orxan · +994 50 326 03 43"; the name falls back to a translated placeholder. */
export function useSiteContactLabel(): (name: string | null, phone: string) => string {
  const { t } = useTranslation();
  return (name, phone) => `${name ?? t('sites.noContactName')} · ${formatPhoneAz(phone)}`;
}
