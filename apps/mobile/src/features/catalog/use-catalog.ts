import type { QuoteRequest } from '@concr/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

export function useSupplier() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.supplier,
    queryFn: () => api.catalog.getSupplier(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useProducts() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.catalog.listProducts(),
    staleTime: 10 * 60_000,
  });
}

export function usePumpOptions() {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.pumpOptions,
    queryFn: () => api.catalog.listPumpOptions(),
    staleTime: 10 * 60_000,
  });
}

/** Live price preview in the wizard; keeps the previous quote on screen while a new one loads. */
export function useQuote(input: QuoteRequest | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.quote(input ?? {}),
    queryFn: () => {
      if (!input) throw new Error('quote input missing');
      return api.catalog.quote(input);
    },
    enabled: input !== null && input.volumeM3 > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
