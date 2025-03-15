import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Make vi available globally
globalThis.vi = vi;

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve({ user: null })),
}));

// Add any other global mocks here
