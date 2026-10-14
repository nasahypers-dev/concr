import type {
  DriverInput,
  ReportRange,
  ServiceAreaInput,
  TruckInput,
  UpdateDriverInput,
  UpdateProductInput,
  UpdatePumpOptionInput,
  UpdateSupplierSettingsInput,
  UpdateTruckInput,
} from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

const FLEET_STALE_MS = 60_000;

export function useTrucks() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.trucks,
    queryFn: () => api.admin.listTrucks(),
    staleTime: FLEET_STALE_MS,
  });
}

export function useDrivers() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.drivers,
    queryFn: () => api.admin.listDrivers(),
    staleTime: FLEET_STALE_MS,
  });
}

export function useProducts() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.products, queryFn: () => api.admin.listProducts() });
}

export function usePumps() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.pumps, queryFn: () => api.admin.listPumpOptions() });
}

export function useSettings() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.settings, queryFn: () => api.admin.getSettings() });
}

export function useReport(range: ReportRange) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.report(range),
    queryFn: () => api.admin.reportSummary(range),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return async (...keys: readonly (readonly unknown[])[]) => {
    await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
}

export function useUpdateProduct() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      api.admin.updateProduct(id, input),
    onSuccess: () => invalidate(queryKeys.products),
  });
}

export function useUpdatePump() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePumpOptionInput }) =>
      api.admin.updatePumpOption(id, input),
    onSuccess: () => invalidate(queryKeys.pumps),
  });
}

export function useCreateTruck() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: TruckInput) => api.admin.createTruck(input),
    onSuccess: () => invalidate(queryKeys.trucks, queryKeys.drivers, queryKeys.boardAll),
  });
}

export function useUpdateTruck() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTruckInput }) =>
      api.admin.updateTruck(id, input),
    onSuccess: () => invalidate(queryKeys.trucks, queryKeys.drivers, queryKeys.boardAll),
  });
}

export function useCreateDriver() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: DriverInput) => api.admin.createDriver(input),
    onSuccess: () => invalidate(queryKeys.drivers, queryKeys.trucks, queryKeys.live),
  });
}

export function useUpdateDriver() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDriverInput }) =>
      api.admin.updateDriver(id, input),
    onSuccess: () => invalidate(queryKeys.drivers, queryKeys.trucks, queryKeys.live),
  });
}

export function useUpdateSettings() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateSupplierSettingsInput) => api.admin.updateSettings(input),
    onSuccess: () => invalidate(queryKeys.settings, queryKeys.supplier),
  });
}

export function useUpdateServiceArea() {
  const api = useApi();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: ServiceAreaInput) => api.admin.updateServiceArea(input),
    onSuccess: () => invalidate(queryKeys.settings),
  });
}
