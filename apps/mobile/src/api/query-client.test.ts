import { ApiClientError, ErrorCode, UserRole } from '@concr/shared';
import { useSessionStore } from '@/store/session.store';
import { createQueryClient } from './query-client';
import type { QueryClient } from '@tanstack/react-query';

const session = {
  role: UserRole.CUSTOMER,
  accessToken: 'mock.user_99.1',
  refreshToken: 'refresh.user_99.1',
  userId: 'user_99',
};

describe('createQueryClient', () => {
  let client: QueryClient;
  beforeEach(() => {
    useSessionStore.getState().setSession(session);
    client = createQueryClient();
  });
  // Drop cache timers so Jest can exit without --forceExit.
  afterEach(() => client.clear());

  it('signs out when a query is rejected as UNAUTHORIZED', async () => {
    await expect(
      client.fetchQuery({
        queryKey: ['me'],
        queryFn: () => Promise.reject(new ApiClientError(ErrorCode.UNAUTHORIZED)),
      }),
    ).rejects.toBeInstanceOf(ApiClientError);
    expect(useSessionStore.getState().accessToken).toBeNull();
    expect(useSessionStore.getState().role).toBeNull();
  });

  it('keeps the session on other errors', async () => {
    await expect(
      client.fetchQuery({
        queryKey: ['orders'],
        queryFn: () => Promise.reject(new ApiClientError(ErrorCode.NOT_FOUND)),
      }),
    ).rejects.toBeInstanceOf(ApiClientError);
    expect(useSessionStore.getState().accessToken).toBe(session.accessToken);
  });
});
