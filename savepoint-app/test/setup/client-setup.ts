import "@testing-library/jest-dom";

import { allHandlers } from "@/test/mocks/handlers";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

vi.mock("@/shared/lib/auth-client", () => {
  const signOut = vi.fn(
    async ({
      fetchOptions,
    }: { fetchOptions?: { onSuccess?: () => void } } = {}) => {
      fetchOptions?.onSuccess?.();
    }
  );
  const signInSocial = vi.fn(async () => undefined);
  return {
    authClient: {
      signOut,
      signIn: { social: signInSocial },
      useSession: vi.fn(() => ({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com",
            name: "Test User",
          },
        },
        isPending: false,
      })),
    },
    signOut,
    signIn: { social: signInSocial },
    useSession: vi.fn(() => ({
      data: {
        user: {
          id: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
      },
      isPending: false,
    })),
  };
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});

global.IntersectionObserver = vi.fn().mockImplementation(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn();
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
export const server = setupServer(...allHandlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
