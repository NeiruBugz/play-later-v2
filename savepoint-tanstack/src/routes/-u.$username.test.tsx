import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserFn } from "@/entities/session/api/get-current-user";
import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./u.$username";

vi.mock("@/features/profile-overview/api", () => ({
  getPublicProfilePageDataFn: vi.fn(),
}));

vi.mock("@/entities/session/api/get-current-user", () => ({
  getCurrentUserFn: vi.fn(),
}));

vi.mock("@/widgets/profile-overview", () => ({
  ProfileOverview: ({ isOwnProfile }: { isOwnProfile?: boolean }) => (
    <div
      data-testid="profile-overview-mock"
      data-is-own={String(!!isOwnProfile)}
    />
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  )),
  createFileRoute: () => (opts: unknown) => ({
    options: opts,
    useLoaderData: () => mockLoaderData,
  }),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  notFound: () => {
    const err = new Error("not-found");
    (err as unknown as { __isNotFound: true }).__isNotFound = true;
    return err;
  },
}));

let mockLoaderData: {
  profile: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    isPublicProfile: boolean;
  };
  stats: {
    statusCounts: Record<string, number>;
    recentGames: never[];
    journalCount: number;
  };
  viewerId: string | null;
} = {
  profile: {
    id: "user-target",
    username: "targetuser",
    name: "Target User",
    image: null,
    isPublicProfile: true,
  },
  stats: { statusCounts: {}, recentGames: [], journalCount: 0 },
  viewerId: null,
};

const invokeLoader = async (username: string) => {
  const loader = (
    Route.options as {
      loader?: (args: { params: { username: string } }) => Promise<unknown>;
    }
  ).loader;
  if (!loader) throw new Error("loader not defined");
  return loader({ params: { username } } as never);
};

describe("/u/$username route", () => {
  describe("given the profile is public and exists", () => {
    beforeEach(() => {
      vi.mocked(getPublicProfilePageDataFn).mockResolvedValue({
        profile: mockLoaderData.profile,
        stats: mockLoaderData.stats,
      } as never);
      vi.mocked(getCurrentUserFn).mockResolvedValue({ user: null } as never);
    });

    it("returns the public profile page data with viewerId=null when anonymous", async () => {
      const result = await invokeLoader("targetuser");
      expect(result).toMatchObject({ viewerId: null });
    });
  });

  describe("given the viewer is the profile owner", () => {
    beforeEach(() => {
      vi.mocked(getPublicProfilePageDataFn).mockResolvedValue({
        profile: mockLoaderData.profile,
        stats: mockLoaderData.stats,
      } as never);
      vi.mocked(getCurrentUserFn).mockResolvedValue({
        user: { id: "user-target", name: "Target", image: null },
      } as never);
    });

    it("returns the viewerId matching the profile owner id", async () => {
      const result = await invokeLoader("targetuser");
      expect(result).toMatchObject({ viewerId: "user-target" });
    });
  });

  describe("given the entity query throws NotFoundError", () => {
    beforeEach(() => {
      vi.mocked(getPublicProfilePageDataFn).mockRejectedValue(
        new NotFoundError("Profile not found")
      );
      vi.mocked(getCurrentUserFn).mockResolvedValue({ user: null } as never);
    });

    it("throws a notFound() result so the router renders 404", async () => {
      await expect(invokeLoader("ghost")).rejects.toMatchObject({
        __isNotFound: true,
      });
    });
  });

  describe("given the component renders with a viewer matching the owner", () => {
    beforeEach(() => {
      mockLoaderData = {
        profile: {
          id: "user-target",
          username: "targetuser",
          name: "Target",
          image: null,
          isPublicProfile: true,
        },
        stats: { statusCounts: {}, recentGames: [], journalCount: 0 },
        viewerId: "user-target",
      };
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("passes isOwnProfile=true to the widget", () => {
      expect(screen.getByTestId("profile-overview-mock")).toHaveAttribute(
        "data-is-own",
        "true"
      );
    });
  });

  describe("given the component renders with an anonymous viewer", () => {
    beforeEach(() => {
      mockLoaderData = {
        profile: {
          id: "user-target",
          username: "targetuser",
          name: "Target",
          image: null,
          isPublicProfile: true,
        },
        stats: { statusCounts: {}, recentGames: [], journalCount: 0 },
        viewerId: null,
      };
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("passes isOwnProfile=false to the widget", () => {
      expect(screen.getByTestId("profile-overview-mock")).toHaveAttribute(
        "data-is-own",
        "false"
      );
    });
  });
});
