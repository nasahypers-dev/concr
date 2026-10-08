import { changeLocale, detectDeviceLocale, initI18n } from './index';

describe('i18n', () => {
  it('detects the mocked device locale', () => {
    expect(detectDeviceLocale()).toBe('az');
  });

  it('renders Azerbaijani letters from the shared bundle', () => {
    const i18n = initI18n('az');
    expect(i18n.t('common.tagline')).toBe('Möhkəmlik. Etibar. Keyfiyyət.');
    expect(i18n.t('auth.welcomeTitle')).toMatch(/[əğıöşüç]/);
  });

  it('interpolates with single braces (shared with next-intl)', () => {
    const i18n = initI18n('az');
    expect(i18n.t('auth.otpHint', { phone: '+994501234567' })).toContain('+994501234567');
    expect(i18n.t('auth.otpHint', { phone: '+994501234567' })).not.toContain('{phone}');
  });

  it('switches language at runtime', async () => {
    const i18n = initI18n('az');
    await changeLocale('ru');
    expect(i18n.t('nav.orders')).toBe('Мои заказы');
    await changeLocale('en');
    expect(i18n.t('nav.orders')).toBe('My orders');
  });
});
