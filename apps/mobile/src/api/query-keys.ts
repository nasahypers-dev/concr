/** TanStack Query keys, one place so invalidation never guesses strings. */
export const queryKeys = {
  supplier: ['supplier'] as const,
  products: ['products'] as const,
  pumpOptions: ['pump-options'] as const,
  me: ['me'] as const,
  sites: ['sites'] as const,
  site: (id: string) => ['sites', id] as const,
  orders: (filter: { status?: readonly string[] } = {}) => ['orders', 'list', filter] as const,
  order: (id: string) => ['orders', 'detail', id] as const,
  orderDocuments: (id: string) => ['orders', 'detail', id, 'documents'] as const,
  orderLive: (id: string) => ['orders', 'detail', id, 'live'] as const,
  quote: (input: Record<string, unknown>) => ['quote', input] as const,
  driverMe: ['driver', 'me'] as const,
  driverDeliveriesAll: ['driver', 'deliveries'] as const,
  driverDeliveries: (date?: string) => ['driver', 'deliveries', date ?? 'today'] as const,
  driverDelivery: (id: string) => ['driver', 'delivery', id] as const,
};
