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

  it('tracks whether the profile still needs a name', () => {
    useSessionStore
      .getState()
      .setSession({
        role: UserRole.CUSTOMER,
        accessToken: 'a',
        refreshToken: 'r',
        profileComplete: false,
      });
    expect(useSessionStore.getState().profileComplete).toBe(false);
    useSessionStore.getState().markProfileComplete();
    expect(useSessionStore.getState().profileComplete).toBe(true);
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().profileComplete).toBe(true);
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
