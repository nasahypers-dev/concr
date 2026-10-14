/** The `next/navigation` router every test sees (wired in jest.setup.js). */
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
};

export function resetRouterMock(): void {
  for (const fn of Object.values(mockRouter)) fn.mockReset();
}
