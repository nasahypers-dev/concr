import { ERROR_CODES } from '../error-codes';
import { defaultLocale, isLocale, locales, messages } from './index';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (typeof acc !== 'object' || acc === null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, value);
}

describe('i18n bundles', () => {
  const referenceKeys = flattenKeys(messages[defaultLocale]).sort();

  it.each(locales)('%s has exactly the same keys as az', (locale) => {
    expect(flattenKeys(messages[locale]).sort()).toEqual(referenceKeys);
  });

  it.each(locales)('%s has no empty strings', (locale) => {
    const empty = referenceKeys.filter((key) => {
      const text = getPath(messages[locale], key);
      return typeof text !== 'string' || text.trim() === '';
    });
    expect(empty).toEqual([]);
  });

  it('has a translation for every error code', () => {
    for (const code of ERROR_CODES) {
      expect(typeof getPath(messages.az, `errors.${code}`)).toBe('string');
    }
  });

  it('uses single-brace placeholders only (works with i18next and next-intl)', () => {
    for (const locale of locales) {
      for (const key of referenceKeys) {
        const text = String(getPath(messages[locale], key));
        expect(text).not.toMatch(/\{\{/);
      }
    }
  });

  it('isLocale narrows correctly', () => {
    expect(isLocale('az')).toBe(true);
    expect(isLocale('tr')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
