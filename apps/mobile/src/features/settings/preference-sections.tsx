import { type Locale, locales } from '@concr/shared';
import { useTranslation } from 'react-i18next';
import { useUpdateProfile } from '@/features/auth/use-auth';
import { THEME_PREFERENCES, type ThemePreference, useSettingsStore } from '@/store/settings.store';
import { Section, SegmentedControl } from '@/ui';

/** Language names are shown in their own language on purpose (never translated). */
const localeLabels: Record<Locale, string> = { az: 'Azərbaycan', ru: 'Русский', en: 'English' };

/** Language and appearance pickers shared by the customer and driver profiles. */
export function PreferenceSections() {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  const switchLocale = (next: Locale) => {
    setLocale(next);
    updateProfile.mutate({ locale: next });
  };

  return (
    <>
      <Section title={t('profile.language')}>
        <SegmentedControl<Locale>
          value={locale}
          onChange={switchLocale}
          options={locales.map((code) => ({ value: code, label: localeLabels[code] }))}
        />
      </Section>

      <Section title={t('profile.appearance')}>
        <SegmentedControl<ThemePreference>
          value={theme}
          onChange={setTheme}
          options={THEME_PREFERENCES.map((value) => ({ value, label: t(`theme.${value}`) }))}
          accessibilityLabel={t('profile.appearance')}
        />
      </Section>
    </>
  );
}
