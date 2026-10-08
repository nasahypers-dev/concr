import az from '../../i18n/az.json';
import en from '../../i18n/en.json';
import ru from '../../i18n/ru.json';

export const locales = ['az', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'az';

/** Shape of every message bundle; `az` is the reference. */
export type Messages = typeof az;

/**
 * All bundles. Typing them as `Record<Locale, Messages>` makes a missing key in
 * ru/en a compile error; i18n.spec.ts additionally rejects extra keys.
 * Interpolation uses single braces `{name}` so the same JSON works with
 * i18next (configured with `{`/`}` prefix) and next-intl.
 */
export const messages: Record<Locale, Messages> = { az, ru, en };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}
