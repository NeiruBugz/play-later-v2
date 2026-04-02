import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FeedItem } from "../types";
import { ActivityFeedItem } from "./activity-feed-item";

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

describe("ActivityFeedItem", () => {
  describe("user name link", () => {
    it("renders the display name linked to the user profile", () => {
      render(<ActivityFeedItem item={buildFeedItem()} />);

      const links = screen.getAllByRole("link", { name: /Alice Smith/i });
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute("href", "/u/alicesmith");
    });

    it("does not render a link when username is null", () => {
      const item = buildFeedItem({
        user: {
          id: "user-2",
          name: "No Handle",
          username: null,
          image: null,
        },
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("No Handle")).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: /No Handle/i })
      ).not.toBeInTheDocument();
    });

    it("falls back to username as display name when name is null", () => {
      const item = buildFeedItem({
        user: {
          id: "user-3",
          name: null,
          username: "alicesmith",
          image: null,
        },
      });

      render(<ActivityFeedItem item={item} />);

      const links = screen.getAllByRole("link", { name: /alicesmith/i });
      expect(links.length).toBeGreaterThanOrEqual(1);
      expect(links[0]).toHaveAttribute("href", "/u/alicesmith");
    });

    it("shows 'Unknown' when both name and username are null", () => {
      const item = buildFeedItem({
        user: { id: "user-4", name: null, username: null, image: null },
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });

  describe("game title link", () => {
    it("renders the game title linked to the game detail page", () => {
      render(<ActivityFeedItem item={buildFeedItem()} />);

      const links = screen.getAllByRole("link", { name: /Hollow Knight/i });
      const gameLinks = links.filter(
        (l) => l.getAttribute("href") === "/games/hollow-knight"
      );
      expect(gameLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("LIBRARY_ADD event", () => {
    it("renders 'added {gameTitle} to their library' description", () => {
      render(
        <ActivityFeedItem item={buildFeedItem({ eventType: "LIBRARY_ADD" })} />
      );

      expect(screen.getByText(/added/i)).toBeInTheDocument();
      expect(screen.getByText(/to their library/i)).toBeInTheDocument();
      const gameLinks = screen.getAllByRole("link", { name: "Hollow Knight" });
      expect(gameLinks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("STATUS_CHANGE event", () => {
    it("renders 'marked {gameTitle} as {status}' description", () => {
      render(
        <ActivityFeedItem
          item={buildFeedItem({
            eventType: "STATUS_CHANGE",
            status: "PLAYING",
          })}
        />
      );

      expect(screen.getByText(/marked/i)).toBeInTheDocument();
      expect(screen.getByText(/as/i)).toBeInTheDocument();
      const gameLinks = screen.getAllByRole("link", { name: "Hollow Knight" });
      expect(gameLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("formats PLAYING status as 'Playing'", () => {
      render(
        <ActivityFeedItem
          item={buildFeedItem({
            eventType: "STATUS_CHANGE",
            status: "PLAYING",
          })}
        />
      );

      expect(screen.getByText("Playing")).toBeInTheDocument();
    });

    it("formats WANT_TO_PLAY status as 'Want to Play'", () => {
      render(
        <ActivityFeedItem
          item={buildFeedItem({
            eventType: "STATUS_CHANGE",
            status: "WANT_TO_PLAY",
          })}
        />
      );

      expect(screen.getByText("Want to Play")).toBeInTheDocument();
    });

    it("formats COMPLETED status as 'Completed'", () => {
      render(
        <ActivityFeedItem
          item={buildFeedItem({
            eventType: "STATUS_CHANGE",
            status: "COMPLETED",
          })}
        />
      );

      expect(screen.getByText("Completed")).toBeInTheDocument();
    });
  });

  describe("user avatar", () => {
    it("renders the avatar image when user has an image", () => {
      render(<ActivityFeedItem item={buildFeedItem()} />);

      const img = screen.getByAltText("Alice Smith's avatar");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/alice.jpg");
    });

    it("renders an initial fallback when user has no image", () => {
      const item = buildFeedItem({
        user: {
          id: "user-1",
          name: "Alice Smith",
          username: "alicesmith",
          image: null,
        },
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  describe("game cover image", () => {
    it("renders the cover image when coverImage is present", () => {
      render(<ActivityFeedItem item={buildFeedItem()} />);

      const img = screen.getByAltText("Hollow Knight cover");
      expect(img).toBeInTheDocument();
    });

    it("renders an N/A placeholder when coverImage is null", () => {
      const item = buildFeedItem({
        game: {
          id: "game-1",
          title: "Hollow Knight",
          coverImage: null,
          slug: "hollow-knight",
        },
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("N/A")).toBeInTheDocument();
      expect(
        screen.queryByAltText("Hollow Knight cover")
      ).not.toBeInTheDocument();
    });
  });

  describe("relative timestamp", () => {
    it("renders a relative time for a recent timestamp", () => {
      const item = buildFeedItem({
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("renders 'just now' for a very recent timestamp", () => {
      const item = buildFeedItem({
        timestamp: new Date(Date.now() - 10 * 1000),
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it("renders hours for timestamps older than 60 minutes", () => {
      const item = buildFeedItem({
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      });

      render(<ActivityFeedItem item={item} />);

      expect(screen.getByText("2h ago")).toBeInTheDocument();
    });
  });
});
