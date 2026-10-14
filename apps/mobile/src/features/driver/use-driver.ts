import {
  bakuDate,
  type CompleteDeliveryInput,
  type DriverDelivery,
  type DriverStatusInput,
  type IsoDate,
  type LocationBatchInput,
  type ShiftInput,
} from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

/** The trip list re-checks itself while the app is open (new assignments, dispatcher changes). */
const LIST_REFRESH_MS = 30_000;

/** Baku calendar days the Today screen shows: today and tomorrow. */
export function tripDays(now = new Date()): { today: IsoDate; tomorrow: IsoDate } {
  return { today: bakuDate(now, 0), tomorrow: bakuDate(now, 1) };
}

export function useDriverMe() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.driverMe, queryFn: () => api.driver.me() });
}

export function useSetShift() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ShiftInput) => api.driver.setShift(input),
    onSuccess: (driver) => {
      queryClient.setQueryData(queryKeys.driverMe, driver);
    },
  });
}

export function useDriverDeliveries(date?: IsoDate) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.driverDeliveries(date),
    queryFn: () => api.driver.listDeliveries(date),
    refetchInterval: LIST_REFRESH_MS,
  });
}

export function useDriverDelivery(id: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.driverDelivery(id ?? ''),
    queryFn: () => api.driver.getDelivery(id ?? ''),
    enabled: id !== null,
  });
}

/** Writes the returned trip into its detail cache and refreshes the day lists. */
function useTripMutation<TInput>(id: string, run: (input: TInput) => Promise<DriverDelivery>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: async (trip) => {
      queryClient.setQueryData(queryKeys.driverDelivery(id), trip);
      await queryClient.invalidateQueries({ queryKey: queryKeys.driverDeliveriesAll });
    },
  });
}

export function useSetDeliveryStatus(id: string) {
  const api = useApi();
  return useTripMutation<DriverStatusInput>(id, (input) => api.driver.setStatus(id, input));
}

export function useCompleteDelivery(id: string) {
  const api = useApi();
  return useTripMutation<CompleteDeliveryInput>(id, (input) => api.driver.complete(id, input));
}

export function usePushLocations(id: string) {
  const api = useApi();
  return useMutation({
    mutationFn: (batch: LocationBatchInput) => api.driver.pushLocations(id, batch),
  });
}
