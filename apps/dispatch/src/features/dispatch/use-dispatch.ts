import type {
  ConfirmOrderInput,
  DispatchCancelInput,
  DispatchDelivery,
  DispatchOrderDetail,
  IsoDate,
  ListDispatchOrdersQuery,
  ReassignDeliveryInput,
  RejectOrderInput,
  ScheduleOrderInput,
} from '@concr/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';
import { selectIsAuthenticated, useSessionStore } from '@/store/session.store';

const INBOX_REFRESH_MS = 15_000;
const BOARD_REFRESH_MS = 15_000;
/** Polling fallback for the live map; the tracker events refresh it sooner (spec §9.6). */
export const LIVE_REFRESH_MS = 10_000;

/** PENDING orders, newest first; also feeds the sidebar badge. */
export function useInbox() {
  const api = useApi();
  const enabled = useSessionStore(selectIsAuthenticated);
  return useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => api.dispatch.listOrders({ status: ['PENDING'], limit: 100 }),
    refetchInterval: INBOX_REFRESH_MS,
    enabled,
  });
}

export function useOrders(query: ListDispatchOrdersQuery) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => api.dispatch.listOrders(query),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string) {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.order(id), queryFn: () => api.dispatch.getOrder(id) });
}

export function useSuggestPlan(id: string, enabled = true) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.plan(id),
    queryFn: () => api.dispatch.suggestPlan(id),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

/** Writes the returned order into its cache and refreshes every list that may show it. */
function useOrderMutation<TInput>(
  id: string,
  run: (input: TInput) => Promise<DispatchOrderDetail>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async (order) => {
      queryClient.setQueryData(queryKeys.order(id), order);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.ordersAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.boardAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.live }),
      ]);
    },
  });
}

export function useConfirmOrder(id: string) {
  const api = useApi();
  return useOrderMutation<ConfirmOrderInput>(id, (input) => api.dispatch.confirm(id, input));
}

export function useRejectOrder(id: string) {
  const api = useApi();
  return useOrderMutation<RejectOrderInput>(id, (input) => api.dispatch.reject(id, input));
}

export function useScheduleOrder(id: string) {
  const api = useApi();
  return useOrderMutation<ScheduleOrderInput>(id, (input) => api.dispatch.schedule(id, input));
}

export function useCancelOrder(id: string) {
  const api = useApi();
  return useOrderMutation<DispatchCancelInput>(id, (input) => api.dispatch.cancel(id, input));
}

export function useReassignDelivery() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReassignDeliveryInput }) =>
      api.dispatch.reassignDelivery(id, input),
    onSuccess: async (trip: DispatchDelivery) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.boardAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.order(trip.orderId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.ordersAll }),
        queryClient.invalidateQueries({ queryKey: queryKeys.live }),
      ]);
    },
  });
}

export function useBoard(date: IsoDate) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.board(date),
    queryFn: () => api.dispatch.board(date),
    refetchInterval: BOARD_REFRESH_MS,
    placeholderData: keepPreviousData,
  });
}

export function useLive() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.live,
    queryFn: () => api.dispatch.live(),
    refetchInterval: LIVE_REFRESH_MS,
  });
}
