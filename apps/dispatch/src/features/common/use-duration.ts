import { useTranslations } from 'next-intl';

/** "1 s 5 dəq" / "40 dəq" from a number of minutes. */
export function useDuration(): (minutes: number) => string {
  const t = useTranslations('panel.time');
  return (minutes) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? t('hoursMinutes', { hours, minutes: rest }) : t('minutes', { minutes });
  };
}
