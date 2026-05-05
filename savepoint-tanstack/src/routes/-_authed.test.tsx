import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireUserIdOrRedirectFn } from "@/entities/session/api/require-user-id-or-redirect";

import { Route } from "./_authed";

vi.mock("@/entities/session/api/require-user-id-or-redirect", () => ({
  requireUserIdOrRedirectFn: vi.fn(),
}));

const syntheticBeforeLoadArgs = {
  context: {},
  location: {} as never,
  params: {},
  search: {},
  cause: "enter",
} as never;

const actions = {
  invokeBeforeLoad: () => Route.options.beforeLoad?.(syntheticBeforeLoadArgs),
};

describe("_authed route guard", () => {
  describe("given the request has no authenticated session", () => {
    beforeEach(() => {
      vi.mocked(requireUserIdOrRedirectFn).mockRejectedValue({
        options: { to: "/login" },
      } as never);
    });

    it("redirects to /login", async () => {
      await expect(actions.invokeBeforeLoad()).rejects.toMatchObject({
        options: { to: "/login" },
      });
    });
  });

  describe("given the request has an authenticated session", () => {
    beforeEach(() => {
      vi.mocked(requireUserIdOrRedirectFn).mockResolvedValue({
        userId: "user-abc-123",
      } as never);
    });

    it("resolves with the authenticated userId in context", async () => {
      await expect(actions.invokeBeforeLoad()).resolves.toMatchObject({
        userId: "user-abc-123",
      });
    });
  });
});
