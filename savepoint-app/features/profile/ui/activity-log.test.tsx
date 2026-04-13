import type {
  FeedItemRow,
  PaginatedFeedResult,
} from "@/data-access-layer/repository/activity-feed/types";
import { render, screen } from "@testing-library/react";

import { ActivityLog } from "./activity-log";

const mockFetchNextPage = vi.fn();
const mockUseActivityLog = vi.fn();

vi.mock("../hooks/use-activity-log", () => ({
  useActivityLog: (...args: unknown[]) => mockUseActivityLog(...args),
}));

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

function buildFeedItemRow(overrides: Partial<FeedItemRow> = {}): FeedItemRow {
  return {
    id: 1,
    status: "PLAYING",
    createdAt: new Date("2024-03-01T10:00:00Z"),
    statusChangedAt: new Date("2024-03-02T10:00:00Z"),
    activityTimestamp: new Date("2024-03-02T10:00:00Z"),
    userId: "user-1",
    gameId: "game-1",
    userName: "Alice Smith",
    userUsername: "alicesmith",
    userImage: null,
    gameTitle: "Hollow Knight",
    gameCoverImage: null,
    gameSlug: "hollow-knight",
    ...overrides,
  };
}

function buildPaginatedResult(
  items: FeedItemRow[],
  nextCursor: PaginatedFeedResult["nextCursor"] = null
): PaginatedFeedResult {
  return { items, nextCursor };
}

function setupHook(
  items: FeedItemRow[],
  options: { hasNextPage?: boolean; isFetchingNextPage?: boolean } = {}
) {
  const pages: PaginatedFeedResult[] = [buildPaginatedResult(items)];

  mockUseActivityLog.mockReturnValue({
    data: { pages },
    fetchNextPage: mockFetchNextPage,
    hasNextPage: options.hasNextPage ?? false,
    isFetchingNextPage: options.isFetchingNextPage ?? false,
  });
}

function renderActivityLog(
  userId = "user-1",
  initialData?: PaginatedFeedResult
) {
  return render(<ActivityLog userId={userId} initialData={initialData} />);
}

describe("ActivityLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActivityLog.mockReturnValue({
      data: { pages: [buildPaginatedResult([])] },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  describe("item list rendering", () => {
    it("renders all provided activity items", () => {
      const items = [
        buildFeedItemRow({ id: 1, gameTitle: "Hollow Knight" }),
        buildFeedItemRow({ id: 2, gameTitle: "Celeste" }),
      ];
      setupHook(items);

      renderActivityLog();

      expect(
        screen.getByRole("link", { name: "Hollow Knight" })
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Celeste" })).toBeInTheDocument();
    });

    it("renders one row per item when the list has a single entry", () => {
      setupHook([buildFeedItemRow({ id: 1, gameTitle: "Elden Ring" })]);

      renderActivityLog();

      expect(
        screen.getByRole("link", { name: "Elden Ring" })
      ).toBeInTheDocument();
    });
  });

  describe("LIBRARY_ADD event rendering", () => {
    it("renders 'added … to their library' text for a LIBRARY_ADD event", () => {
      const item = buildFeedItemRow({
        id: 1,
        status: "SHELF",
        createdAt: new Date("2024-03-01T10:00:00Z"),
        statusChangedAt: new Date("2024-03-01T10:00:00Z"),
        activityTimestamp: new Date("2024-03-01T10:00:00Z"),
        gameTitle: "Hollow Knight",
      });
      setupHook([item]);

      renderActivityLog();

      expect(screen.getByText(/added/i)).toBeInTheDocument();
      expect(screen.getByText(/to their library/i)).toBeInTheDocument();
    });

    it("does not render 'marked … as' text for a LIBRARY_ADD event", () => {
      const item = buildFeedItemRow({
        id: 1,
        status: "SHELF",
        createdAt: new Date("2024-03-01T10:00:00Z"),
        statusChangedAt: new Date("2024-03-01T10:00:00Z"),
        activityTimestamp: new Date("2024-03-01T10:00:00Z"),
      });
      setupHook([item]);

      renderActivityLog();

      expect(screen.queryByText(/marked/i)).not.toBeInTheDocument();
    });
  });

  describe("STATUS_CHANGE event rendering", () => {
    it("renders 'marked … as {status}' text for a STATUS_CHANGE event", () => {
      const item = buildFeedItemRow({
        id: 1,
        status: "PLAYING",
        createdAt: new Date("2024-03-01T10:00:00Z"),
        statusChangedAt: new Date("2024-03-02T12:00:00Z"),
        activityTimestamp: new Date("2024-03-02T12:00:00Z"),
        gameTitle: "Celeste",
      });
      setupHook([item]);

      renderActivityLog();

      expect(screen.getByText(/marked/i)).toBeInTheDocument();
      expect(screen.getByText(/Playing/i)).toBeInTheDocument();
    });

    it("does not render 'added … to their library' text for a STATUS_CHANGE event", () => {
      const item = buildFeedItemRow({
        id: 1,
        status: "PLAYING",
        createdAt: new Date("2024-03-01T10:00:00Z"),
        statusChangedAt: new Date("2024-03-02T12:00:00Z"),
        activityTimestamp: new Date("2024-03-02T12:00:00Z"),
      });
      setupHook([item]);

      renderActivityLog();

      expect(screen.queryByText(/to their library/i)).not.toBeInTheDocument();
    });

    it("formats PLAYING status as 'Playing'", () => {
      setupHook([
        buildFeedItemRow({
          id: 1,
          status: "PLAYING",
          statusChangedAt: new Date("2024-03-02T12:00:00Z"),
          activityTimestamp: new Date("2024-03-02T12:00:00Z"),
        }),
      ]);

      renderActivityLog();

      expect(screen.getByText("Playing")).toBeInTheDocument();
    });

    it("formats PLAYED status as 'Played'", () => {
      setupHook([
        buildFeedItemRow({
          id: 1,
          status: "PLAYED",
          statusChangedAt: new Date("2024-03-02T12:00:00Z"),
          activityTimestamp: new Date("2024-03-02T12:00:00Z"),
        }),
      ]);

      renderActivityLog();

      expect(screen.getByText("Played")).toBeInTheDocument();
    });

    it("formats WISHLIST status as 'Wishlist'", () => {
      setupHook([
        buildFeedItemRow({
          id: 1,
          status: "WISHLIST",
          statusChangedAt: new Date("2024-03-02T12:00:00Z"),
          activityTimestamp: new Date("2024-03-02T12:00:00Z"),
        }),
      ]);

      renderActivityLog();

      expect(screen.getByText("Wishlist")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("renders an empty state message when the item list is empty", () => {
      setupHook([]);

      renderActivityLog();

      expect(screen.getByText(/no activity/i)).toBeInTheDocument();
    });

    it("does not render any activity items when the list is empty", () => {
      setupHook([]);

      renderActivityLog();

      expect(
        screen.queryByRole("link", { name: /hollow knight/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("pagination — load more available", () => {
    it("shows a load-more trigger element when hasNextPage is true", () => {
      setupHook([buildFeedItemRow()], { hasNextPage: true });

      renderActivityLog();

      expect(screen.getByTestId("activity-log-sentinel")).toBeInTheDocument();
    });

    it("does not show the 'No more activity' message when hasNextPage is true", () => {
      setupHook([buildFeedItemRow()], { hasNextPage: true });

      renderActivityLog();

      expect(screen.queryByText(/no more activity/i)).not.toBeInTheDocument();
    });

    it("shows a loading indicator while fetching the next page", () => {
      setupHook([buildFeedItemRow()], {
        hasNextPage: true,
        isFetchingNextPage: true,
      });

      renderActivityLog();

      expect(screen.getByTestId("activity-log-loading")).toBeInTheDocument();
    });
  });

  describe("pagination — no more pages", () => {
    it("shows the 'No more activity' end message when hasNextPage is false and items exist", () => {
      setupHook([buildFeedItemRow()], { hasNextPage: false });

      renderActivityLog();

      expect(screen.getByText(/no more activity/i)).toBeInTheDocument();
    });

    it("does not show the loading indicator when isFetchingNextPage is false", () => {
      setupHook([buildFeedItemRow()], { hasNextPage: false });

      renderActivityLog();

      expect(
        screen.queryByTestId("activity-log-loading")
      ).not.toBeInTheDocument();
    });
  });

  describe("hook integration", () => {
    it("passes userId and initialData to useActivityLog", () => {
      const initialData = buildPaginatedResult([buildFeedItemRow()]);
      setupHook([]);

      renderActivityLog("user-abc", initialData);

      expect(mockUseActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-abc",
          initialData,
        })
      );
    });

    it("works without initialData prop", () => {
      setupHook([]);

      renderActivityLog("user-xyz");

      expect(mockUseActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-xyz" })
      );
    });
  });
});
