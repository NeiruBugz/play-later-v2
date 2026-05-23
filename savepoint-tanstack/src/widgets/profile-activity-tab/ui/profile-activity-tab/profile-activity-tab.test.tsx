import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedItem } from "@/entities/activity-feed/model";

import { ProfileActivityTab } from "./profile-activity-tab";

const baseItem: FeedItem = {
  id: 1,
  status: "PLAYING",
  activityTimestamp: new Date("2026-05-19T10:00:00.000Z"),
  userId: "user-alice",
  gameId: "game-1",
  userName: "Alice",
  userUsername: "alice",
  userImage: null,
  gameTitle: "Balatro",
  gameCoverImage: null,
  gameSlug: "balatro",
};

const secondItem: FeedItem = {
  ...baseItem,
  id: 2,
  status: "PLAYED",
  gameTitle: "Tunic",
};

const elements = {
  queryEmpty: () => screen.queryByTestId("profile-activity-empty"),
  getEntries: () => screen.queryAllByTestId("profile-activity-entry"),
  queryLoadMore: () => screen.queryByRole("button", { name: /load more/i }),
};

describe("ProfileActivityTab", () => {
  describe("given no items", () => {
    beforeEach(() => {
      render(
        <ProfileActivityTab
          initialItems={[]}
          initialNextCursor={null}
          loadMore={vi.fn()}
        />
      );
    });

    it("renders the locked empty state", () => {
      expect(elements.queryEmpty()).not.toBeNull();
    });

    it("does not render a Load more button", () => {
      expect(elements.queryLoadMore()).toBeNull();
    });
  });

  describe("given a single item and no cursor", () => {
    beforeEach(() => {
      render(
        <ProfileActivityTab
          initialItems={[baseItem]}
          initialNextCursor={null}
          loadMore={vi.fn()}
        />
      );
    });

    it("renders one activity entry", () => {
      expect(elements.getEntries()).toHaveLength(1);
    });

    it("includes the username, game title, and status in the line", () => {
      expect(screen.getByText("@alice added Balatro to Playing")).toBeTruthy();
    });

    it("does not render Load more when no cursor", () => {
      expect(elements.queryLoadMore()).toBeNull();
    });
  });

  describe("given a cursor and the user clicks Load more", () => {
    const loadMore = vi.fn();

    beforeEach(async () => {
      loadMore.mockReset();
      loadMore.mockResolvedValue({
        items: [secondItem],
        nextCursor: null,
      });
      render(
        <ProfileActivityTab
          initialItems={[baseItem]}
          initialNextCursor={{ timestamp: "t", id: 1 }}
          loadMore={loadMore}
        />
      );
      await userEvent.click(elements.queryLoadMore() as HTMLElement);
    });

    it("calls loadMore with the current cursor", async () => {
      await waitFor(() => {
        expect(loadMore).toHaveBeenCalledOnce();
      });
      expect(loadMore).toHaveBeenCalledWith({ timestamp: "t", id: 1 });
    });

    it("appends the returned items to the list", async () => {
      await waitFor(() => {
        expect(elements.getEntries()).toHaveLength(2);
      });
    });
  });
});
