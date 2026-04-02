import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FeedItem } from "../types";
import { ActivityFeedEmpty } from "./activity-feed-empty";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("../server-actions/follow-user", () => ({
  followUserAction: vi
    .fn()
    .mockResolvedValue({ success: true, data: undefined }),
}));

vi.mock("../server-actions/unfollow-user", () => ({
  unfollowUserAction: vi
    .fn()
    .mockResolvedValue({ success: true, data: undefined }),
}));

function buildFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "feed-1",
    eventType: "LIBRARY_ADD",
    status: "",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: {
      id: "user-1",
      name: "Alice Smith",
      username: "alicesmith",
      image: "https://example.com/alice.jpg",
    },
    game: {
      id: "game-1",
      title: "Hollow Knight",
      coverImage: "cover_abc123",
      slug: "hollow-knight",
    },
    ...overrides,
  };
}

describe("ActivityFeedEmpty", () => {
  describe("given items is an empty array", () => {
    it("renders the 'No activity yet' fallback message", () => {
      render(<ActivityFeedEmpty items={[]} />);

      expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();
    });

    it("does not render the popular activity banner", () => {
      render(<ActivityFeedEmpty items={[]} />);

      expect(
        screen.queryByText(/Showing popular activity/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("given items has entries", () => {
    it("renders the banner text", () => {
      render(<ActivityFeedEmpty items={[buildFeedItem()]} />);

      expect(
        screen.getByText(
          "Showing popular activity. Follow gamers to personalize your feed."
        )
      ).toBeInTheDocument();
    });

    it("renders all provided activity items", () => {
      const items = [
        buildFeedItem({
          id: "feed-1",
          game: {
            id: "game-1",
            title: "Hollow Knight",
            coverImage: null,
            slug: "hollow-knight",
          },
        }),
        buildFeedItem({
          id: "feed-2",
          user: {
            id: "user-2",
            name: "Bob Jones",
            username: "bobjones",
            image: null,
          },
          game: {
            id: "game-2",
            title: "Celeste",
            coverImage: null,
            slug: "celeste",
          },
        }),
      ];

      render(<ActivityFeedEmpty items={items} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });

    it("renders a Follow button for each item with a username", () => {
      const items = [
        buildFeedItem({ id: "feed-1" }),
        buildFeedItem({
          id: "feed-2",
          user: {
            id: "user-2",
            name: "Bob Jones",
            username: "bobjones",
            image: null,
          },
        }),
      ];

      render(<ActivityFeedEmpty items={items} />);

      const followButtons = screen.getAllByRole("button", { name: "Follow" });
      expect(followButtons).toHaveLength(2);
    });

    it("does not render a Follow button for items with no username", () => {
      const items = [
        buildFeedItem({
          id: "feed-1",
          user: {
            id: "user-1",
            name: "Alice Smith",
            username: null,
            image: null,
          },
        }),
      ];

      render(<ActivityFeedEmpty items={items} />);

      expect(
        screen.queryByRole("button", { name: "Follow" })
      ).not.toBeInTheDocument();
    });

    it("renders Follow buttons with the correct followingId for each user", () => {
      const items = [
        buildFeedItem({
          id: "feed-1",
          user: {
            id: "user-aaa",
            name: "Alice",
            username: "alice",
            image: null,
          },
        }),
        buildFeedItem({
          id: "feed-2",
          user: { id: "user-bbb", name: "Bob", username: "bob", image: null },
        }),
      ];

      render(<ActivityFeedEmpty items={items} />);

      const followButtons = screen.getAllByRole("button", { name: "Follow" });
      expect(followButtons).toHaveLength(2);
    });
  });
});
