import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicProfilePageDataFn } from "@/features/profile-overview/api";
import {
  getActivityFeedFn,
  getActivityForUserFn,
} from "@/features/view-activity-feed/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./u.$username.index";

vi.mock("@/features/profile-overview/api", () => ({
  getPublicProfilePageDataFn: vi.fn(),
}));

vi.mock("@/features/view-activity-feed/api", () => ({
  getActivityFeedFn: vi.fn().mockResolvedValue({ items: [], nextCursor: null }),
  getActivityForUserFn: vi
    .fn()
    .mockResolvedValue({ items: [], nextCursor: null }),
}));

vi.mock("@/features/follow-user", () => ({
  FollowUserButton: () => (
    <button data-testid="follow-button-mock">Follow</button>
  ),
}));

vi.mock("@/features/unfollow-user", () => ({
  UnfollowUserButton: () => (
    <button data-testid="unfollow-button-mock">Unfollow</button>
  ),
}));

vi.mock("@/widgets", () => ({
  ProfileOverview: ({
    isOwnProfile,
    followerCount,
    followingCount,
    headerActions,
  }: {
    isOwnProfile?: boolean;
    followerCount?: number;
    followingCount?: number;
    headerActions?: React.ReactNode;
  }) => (
    <div
      data-testid="profile-overview-mock"
      data-is-own={String(!!isOwnProfile)}
      data-follower-count={String(followerCount ?? "")}
      data-following-count={String(followingCount ?? "")}
    >
      {headerActions}
    </div>
  ),
  ProfileActivityTab: () => <div data-testid="activity-tab-mock" />,
  UserList: () => <div data-testid="user-list-mock" />,
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
  followerCount: number;
  followingCount: number;
  isFollowing: boolean | null;
  activity: { items: never[]; nextCursor: null } | null;
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
  followerCount: 0,
  followingCount: 0,
  isFollowing: null,
  activity: null,
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
  describe("given the page data resolves", () => {
    const pageData = {
      profile: mockLoaderData.profile,
      stats: mockLoaderData.stats,
      followerCount: 3,
      followingCount: 4,
      isFollowing: true,
      viewerId: "viewer-1",
      activity: { items: [], nextCursor: null },
      libraryItems: [],
    };
    let result: unknown;

    beforeEach(async () => {
      vi.clearAllMocks();
      vi.mocked(getPublicProfilePageDataFn).mockResolvedValue(
        pageData as never
      );
      result = await invokeLoader("targetuser");
    });

    it("returns the server-resolved viewer and activity untouched", () => {
      expect(result).toEqual(pageData);
    });

    it("makes a single server call for the whole page", () => {
      expect(getPublicProfilePageDataFn).toHaveBeenCalledTimes(1);
      expect(getPublicProfilePageDataFn).toHaveBeenCalledWith({
        data: { username: "targetuser" },
      });
      expect(getActivityFeedFn).not.toHaveBeenCalled();
      expect(getActivityForUserFn).not.toHaveBeenCalled();
    });
  });

  describe("given the entity query throws NotFoundError", () => {
    beforeEach(() => {
      vi.mocked(getPublicProfilePageDataFn).mockRejectedValue(
        new NotFoundError("Profile not found")
      );
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
        followerCount: 0,
        followingCount: 0,
        isFollowing: null,
        activity: { items: [], nextCursor: null },
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

    it("does not inject a follow/unfollow CTA into the header on own-profile", () => {
      expect(screen.queryByTestId("follow-button-mock")).toBeNull();
      expect(screen.queryByTestId("unfollow-button-mock")).toBeNull();
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
        followerCount: 0,
        followingCount: 0,
        isFollowing: null,
        activity: null,
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

    it("does not inject a follow/unfollow CTA for anonymous viewers", () => {
      expect(screen.queryByTestId("follow-button-mock")).toBeNull();
      expect(screen.queryByTestId("unfollow-button-mock")).toBeNull();
    });
  });

  describe("given a signed-in non-owner viewer who is not following", () => {
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
        viewerId: "user-viewer",
        followerCount: 3,
        followingCount: 5,
        isFollowing: false,
        activity: { items: [], nextCursor: null },
      };
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("injects the Follow button into the header", () => {
      expect(screen.queryByTestId("follow-button-mock")).not.toBeNull();
      expect(screen.queryByTestId("unfollow-button-mock")).toBeNull();
    });

    it("passes the follower / following counts to the widget", () => {
      const widget = screen.getByTestId("profile-overview-mock");
      expect(widget).toHaveAttribute("data-follower-count", "3");
      expect(widget).toHaveAttribute("data-following-count", "5");
    });
  });

  describe("given a signed-in non-owner viewer who is already following", () => {
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
        viewerId: "user-viewer",
        followerCount: 3,
        followingCount: 5,
        isFollowing: true,
        activity: { items: [], nextCursor: null },
      };
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("injects the Unfollow button into the header", () => {
      expect(screen.queryByTestId("unfollow-button-mock")).not.toBeNull();
      expect(screen.queryByTestId("follow-button-mock")).toBeNull();
    });
  });
});
