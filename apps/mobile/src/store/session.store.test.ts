import { UserRole } from '@concr/shared';
import * as SecureStore from 'expo-secure-store';
import { selectIsAuthenticated, useSessionStore } from './session.store';

describe('session store', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('starts anonymous', () => {
    expect(selectIsAuthenticated(useSessionStore.getState())).toBe(false);
  });

  it('authenticates mobile roles only', () => {
    useSessionStore
      .getState()
      .setSession({ role: UserRole.DRIVER, accessToken: 'a', refreshToken: 'r' });
    expect(selectIsAuthenticated(useSessionStore.getState())).toBe(true);

    useSessionStore
      .getState()
      .setSession({ role: UserRole.DISPATCHER, accessToken: 'a', refreshToken: 'r' });
    expect(selectIsAuthenticated(useSessionStore.getState())).toBe(false);
  });

  it('persists tokens to secure storage and clears them', async () => {
    useSessionStore
      .getState()
      .setSession({ role: UserRole.CUSTOMER, accessToken: 'a', refreshToken: 'r' });
    await Promise.resolve();
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'concr.session',
      expect.stringContaining('"accessToken":"a"'),
    );
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
