import * as SecureStore from 'expo-secure-store';
import { colorScheme } from 'nativewind';
import { i18n, initI18n } from '@/i18n';
import { useSettingsStore } from './settings.store';

jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

beforeAll(() => {
  initI18n('az');
});

describe('settings store', () => {
  it('defaults to the system theme and Azerbaijani', () => {
    expect(useSettingsStore.getState().theme).toBe('system');
    expect(useSettingsStore.getState().locale).toBe('az');
  });

  it('applies a manual theme through NativeWind and persists it', async () => {
    useSettingsStore.getState().setTheme('dark');
    expect(colorScheme.set).toHaveBeenCalledWith('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
    await Promise.resolve();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'concr.settings',
      expect.stringContaining('"theme":"dark"'),
    );
    useSettingsStore.getState().setTheme('system');
    expect(colorScheme.set).toHaveBeenLastCalledWith('system');
  });

  it('switches the UI language and persists the choice', async () => {
    useSettingsStore.getState().setLocale('ru');
    expect(i18n.language).toBe('ru');
    await Promise.resolve();
    expect(SecureStore.setItemAsync).toHaveBeenLastCalledWith(
      'concr.settings',
      expect.stringContaining('"locale":"ru"'),
    );
    useSettingsStore.getState().setLocale('az');
    expect(i18n.language).toBe('az');
  });
});
