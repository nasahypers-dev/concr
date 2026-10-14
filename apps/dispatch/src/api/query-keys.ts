/** TanStack Query keys, one place so invalidation never guesses strings. */
export const queryKeys = {
  supplier: ['supplier'] as const,
  ordersAll: ['dispatch', 'orders'] as const,
  inbox: ['dispatch', 'orders', 'inbox'] as const,
  orders: (filter: Record<string, unknown>) => ['dispatch', 'orders', 'list', filter] as const,
  order: (id: string) => ['dispatch', 'order', id] as const,
  plan: (id: string) => ['dispatch', 'plan', id] as const,
  boardAll: ['dispatch', 'board'] as const,
  board: (date: string) => ['dispatch', 'board', date] as const,
  live: ['dispatch', 'live'] as const,
  trucks: ['admin', 'trucks'] as const,
  drivers: ['admin', 'drivers'] as const,
  products: ['admin', 'products'] as const,
  pumps: ['admin', 'pumps'] as const,
  settings: ['admin', 'settings'] as const,
  report: (range: { from: string; to: string }) => ['admin', 'report', range] as const,
};
