import type { Messages } from '@concr/shared';

// Typed translation keys: t('auth.welcomeTitle') is checked against packages/shared/i18n/az.json.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Messages };
    returnNull: false;
  }
}
