import type { CreateOrderInput, LiveLocation, OrderStatus } from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

const LIST_LIMIT = 50;

export function useOrders(status?: readonly OrderStatus[]) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.orders({ status }),
    queryFn: () => api.orders.list({ status: status ? [...status] : undefined, limit: LIST_LIMIT }),
  });
}

export function useOrder(id: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.order(id ?? ''),
    queryFn: () => api.orders.get(id ?? ''),
    enabled: id !== null,
  });
}

export function useOrderDocuments(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.orderDocuments(id),
    queryFn: () => api.orders.listDocuments(id),
  });
}

export function useCreateOrder() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderInput) => api.orders.create(input),
    onSuccess: async (order) => {
      queryClient.setQueryData(queryKeys.order(order.id), order);
      await queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

export function useCancelOrder(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => api.orders.cancel(id, { reason }),
    onSuccess: async (order) => {
      queryClient.setQueryData(queryKeys.order(id), order);
      await queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

export function useReorderDraft() {
  const api = useApi();
  return useMutation({ mutationFn: (id: string) => api.orders.reorder(id) });
}

export interface OrderLiveState {
  /** Latest position per delivery id. */
  positions: Record<string, LiveLocation>;
  /** Timestamp of the last event, for a "siqnal yoxdur" indicator. */
  lastEventAt: string | null;
}

/**
 * Spec §9.3: REST snapshot first, then the live stream. Status events refresh the order detail
 * so timeline, badges and ETA stay in sync without polling.
 */
export function useOrderLive(orderId: string | null, enabled = true): OrderLiveState {
  const api = useApi();
  const queryClient = useQueryClient();
  const [state, setState] = useState<OrderLiveState>({ positions: {}, lastEventAt: null });

  useEffect(() => {
    if (!orderId || !enabled) return undefined;
    let active = true;
    api.tracking
      .getOrderLive(orderId)
      .then((snapshot) => {
        if (!active) return;
        setState((prev) => ({
          positions: {
            ...prev.positions,
            ...Object.fromEntries(snapshot.map((loc) => [loc.deliveryId, loc])),
          },
          lastEventAt: snapshot[0]?.at ?? prev.lastEventAt,
        }));
      })
      .catch(() => undefined);

    const unsubscribe = api.tracking.subscribeOrder(orderId, {
      onLocation: (event) => {
        setState((prev) => ({
          positions: { ...prev.positions, [event.deliveryId]: event },
          lastEventAt: event.at,
        }));
      },
      onDeliveryStatus: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      },
      onOrderStatus: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
        void queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
      },
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [api, orderId, enabled, queryClient]);

  return state;
}
