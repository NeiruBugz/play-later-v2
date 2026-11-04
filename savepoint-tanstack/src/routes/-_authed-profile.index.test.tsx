import { describe, expect, it, vi } from "vitest";

import { Route } from "./_authed/profile.index";

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  )),
  createFileRoute: () => (opts: unknown) => ({ options: opts }),
}));

const invokeBeforeLoad = (
  username: string | null,
  search: Record<string, unknown> = {}
) => {
  const beforeLoad = (
    Route.options as { beforeLoad?: (args: unknown) => unknown }
  ).beforeLoad;
  if (!beforeLoad) throw new Error("beforeLoad not defined");
  return () =>
    beforeLoad({
      context: { user: { id: "user-1", username } },
      location: {},
      params: {},
      search,
      cause: "enter",
    });
};

describe("/_authed/profile redirect", () => {
  describe("given the signed-in user has a username", () => {
    it("redirects to /u/$username with the context username", () => {
      expect(invokeBeforeLoad("NeiruBugzDev")).toThrowError(
        expect.objectContaining({
          options: expect.objectContaining({
            to: "/u/$username",
            params: { username: "NeiruBugzDev" },
          }),
        })
      );
    });

    it("preserves search params on redirect", () => {
      expect(invokeBeforeLoad("NeiruBugzDev", { edit: "true" })).toThrowError(
        expect.objectContaining({
          options: expect.objectContaining({ search: { edit: "true" } }),
        })
      );
    });
  });

  describe("given the signed-in user has no username yet", () => {
    it("redirects to /profile/setup", () => {
      expect(invokeBeforeLoad(null)).toThrowError(
        expect.objectContaining({
          options: expect.objectContaining({ to: "/profile/setup" }),
        })
      );
    });
  });
});
