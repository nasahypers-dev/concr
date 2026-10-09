import type { SiteInput } from '@concr/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/api-provider';
import { queryKeys } from '@/api/query-keys';

export function useSites() {
  const api = useApi();
  return useQuery({ queryKey: queryKeys.sites, queryFn: () => api.sites.list() });
}

export function useSite(id: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.site(id ?? ''),
    queryFn: () => api.sites.get(id ?? ''),
    enabled: id !== null,
  });
}

export function useCreateSite() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SiteInput) => api.sites.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
}

export function useUpdateSite(id: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<SiteInput>) => api.sites.update(id, input),
    onSuccess: async (site) => {
      queryClient.setQueryData(queryKeys.site(id), site);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
}

export function useDeleteSite() {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.sites.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.sites });
    },
  });
}
