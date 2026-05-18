import { describe, expect, it, vi } from "vitest";

import { getProfilePageDataFn } from "@/features/profile-overview/api";

import { Route } from "./_authed/profile";

vi.mock("@/features/profile-overview/api", () => ({
  getProfilePageDataFn: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  )),
  createFileRoute: () => (opts: unknown) => ({ options: opts }),
}));

type BeforeLoadArgs = {
  context: Record<string, unknown>;
  location: unknown;
  params: Record<string, unknown>;
  search: Record<string, unknown>;
  cause: string;
};

const syntheticBeforeLoadArgs = (search: Record<string, unknown> = {}) =>
  ({
    context: {},
    location: {},
    params: {},
    search,
    cause: "enter",
  }) as unknown as BeforeLoadArgs;

const invokeBeforeLoad = async (search?: Record<string, unknown>) => {
  const beforeLoad = (
    Route.options as { beforeLoad?: (args: BeforeLoadArgs) => unknown }
  ).beforeLoad;
  if (!beforeLoad) throw new Error("beforeLoad not defined");
  return beforeLoad(syntheticBeforeLoadArgs(search) as never);
};

describe("/_authed/profile redirect", () => {
  describe("given the signed-in user has a username", () => {
    it("redirects to /u/$username with the resolved username", async () => {
      vi.mocked(getProfilePageDataFn).mockResolvedValue({
        profile: {
          id: "user-1",
          name: "Neiru",
          username: "NeiruBugzDev",
          image: null,
          isPublicProfile: true,
        },
        stats: {
          statusCounts: {} as never,
          recentGames: [],
          journalCount: 0,
        },
      } as never);

      await expect(invokeBeforeLoad()).rejects.toMatchObject({
        options: {
          to: "/u/$username",
          params: { username: "NeiruBugzDev" },
        },
      });
    });

    it("preserves search params on redirect", async () => {
      vi.mocked(getProfilePageDataFn).mockResolvedValue({
        profile: {
          id: "user-1",
          name: "Neiru",
          username: "NeiruBugzDev",
          image: null,
          isPublicProfile: true,
        },
        stats: {
          statusCounts: {} as never,
          recentGames: [],
          journalCount: 0,
        },
      } as never);

      await expect(invokeBeforeLoad({ edit: "true" })).rejects.toMatchObject({
        options: { search: { edit: "true" } },
      });
    });
  });

  describe("given the signed-in user has no username yet", () => {
    it("redirects to /settings/profile so they can set one", async () => {
      vi.mocked(getProfilePageDataFn).mockResolvedValue({
        profile: {
          id: "user-2",
          name: null,
          username: null,
          image: null,
          isPublicProfile: false,
        },
        stats: {
          statusCounts: {} as never,
          recentGames: [],
          journalCount: 0,
        },
      } as never);

      await expect(invokeBeforeLoad()).rejects.toMatchObject({
        options: { to: "/settings/profile" },
      });
    });
  });
});
