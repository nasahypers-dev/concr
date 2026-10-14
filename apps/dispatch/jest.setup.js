/* global jest */
import '@testing-library/jest-dom';

// next/navigation outside a Next runtime: one shared router mock (src/test/router-mock.ts).
jest.mock('next/navigation', () => {
  const { mockRouter } = jest.requireActual('./src/test/router-mock');
  return {
    useRouter: () => mockRouter,
    usePathname: () => '/inbox',
    useSearchParams: () => new URLSearchParams(),
    redirect: jest.fn(),
    notFound: jest.fn(),
  };
});

// jsdom lacks the layout APIs Base UI popups and sonner probe.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => undefined;
  }
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => 'blob:mock';
    URL.revokeObjectURL = () => undefined;
  }
}
