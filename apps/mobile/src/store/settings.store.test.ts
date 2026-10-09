import * as SecureStore from 'expo-secure-store';
import { colorScheme } from 'nativewind';
import { useSettingsStore } from './settings.store';

jest.mock('nativewind', () => ({ colorScheme: { set: jest.fn() } }));

describe('settings store', () => {
  it('defaults to the system theme', () => {
    expect(useSettingsStore.getState().theme).toBe('system');
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
});
