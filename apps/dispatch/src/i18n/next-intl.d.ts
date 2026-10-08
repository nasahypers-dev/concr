import type { Locale, Messages } from '@concr/shared';

// Typed translation keys: t('auth.login') is checked against packages/shared/i18n/az.json.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
