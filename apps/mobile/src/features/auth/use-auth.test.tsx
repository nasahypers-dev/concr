import { createFixtures, createMockApiClient } from '@concr/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';
import { ApiProvider } from '@/api/api-provider';
import { useSessionStore } from '@/store/session.store';
import {
  DEV_CUSTOMER_PHONE,
  DEV_OTP_CODE,
  useLogout,
  useRequestOtp,
  useVerifyOtp,
} from './use-auth';

function makeWrapper() {
  const client = createMockApiClient({
    tokenProvider: () => useSessionStore.getState().accessToken,
    fixtures: createFixtures(new Date('2026-10-09T08:30:00.000Z')),
    latencyMs: 0,
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <ApiProvider client={client}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    );
  };
}

describe('auth hooks on the mock client', () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it('requests and verifies an OTP, then stores the session', async () => {
    const wrapper = makeWrapper();
    const { result } = await renderHook(
      () => ({ request: useRequestOtp(), verify: useVerifyOtp() }),
      { wrapper },
    );
    await act(async () => {
      const res = await result.current.request.mutateAsync({ phone: DEV_CUSTOMER_PHONE });
      expect(res.devCode).toBe(DEV_OTP_CODE);
    });
    await act(async () => {
      await result.current.verify.mutateAsync({ phone: DEV_CUSTOMER_PHONE, code: DEV_OTP_CODE });
    });
    await waitFor(() => expect(useSessionStore.getState().accessToken).toMatch(/^mock\./));
    expect(useSessionStore.getState().role).toBe('CUSTOMER');
    expect(useSessionStore.getState().userId).toBe('cust_1');
  });

  it('surfaces a wrong code as an API error and clears the session on logout', async () => {
    const wrapper = makeWrapper();
    const { result } = await renderHook(() => ({ verify: useVerifyOtp(), logout: useLogout() }), {
      wrapper,
    });
    await act(async () => {
      await expect(
        result.current.verify.mutateAsync({ phone: DEV_CUSTOMER_PHONE, code: '000000' }),
      ).rejects.toMatchObject({ code: 'OTP_INVALID' });
    });
    expect(useSessionStore.getState().accessToken).toBeNull();

    await act(async () => {
      await result.current.verify.mutateAsync({ phone: DEV_CUSTOMER_PHONE, code: DEV_OTP_CODE });
    });
    await waitFor(() => expect(useSessionStore.getState().accessToken).not.toBeNull());
    await act(async () => {
      await result.current.logout.mutateAsync();
    });
    await waitFor(() => expect(useSessionStore.getState().accessToken).toBeNull());
  });
});
