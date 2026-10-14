import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

/** Supplier name, plant and settings for the top bar and the map. */
export function useSupplier() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.supplier,
    queryFn: () => api.catalog.getSupplier(),
    staleTime: 5 * 60_000,
  });
}
