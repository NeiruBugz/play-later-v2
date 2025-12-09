import { JournalService } from "@/data-access-layer/services";
import { renderWithTestProviders } from "@/test/utils/test-provider";
import { render, screen } from "@testing-library/react";

import { requireServerUserId } from "@/shared/lib/app/auth";
import { prisma } from "@/shared/lib/app/db";
import type { JournalEntryDomain } from "@/shared/types";

import { JournalTimeline } from "./journal-timeline";

vi.mock("@/data-access-layer/services", () => ({
  JournalService: vi.fn(),
}));

vi.mock("@/shared/lib/app/auth", () => ({
  requireServerUserId: vi.fn(),
}));

vi.mock("@/shared/lib/app/db", () => ({
  prisma: {
    game: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("./journal-entry-card", () => ({
  JournalEntryCard: ({
    entry,
    game,
  }: {
    entry: JournalEntryDomain;
    game: any;
  }) => (
    <div data-testid={`journal-entry-card-${entry.id}`}>
      {entry.title || "Untitled Entry"} - {game.title}
    </div>
  ),
}));

const mockRequireServerUserId = vi.mocked(requireServerUserId);
const mockJournalService = vi.mocked(JournalService);
const mockPrisma = vi.mocked(prisma);

const createMockEntry = (
  overrides: Partial<JournalEntryDomain> = {}
): JournalEntryDomain => ({
  id: "entry-1",
  userId: "user-1",
  gameId: "game-1",
  libraryItemId: null,
  title: "My First Entry",
  content: "This is my journal entry content.",
  mood: null,
  playSession: null,
  visibility: "PRIVATE",
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  publishedAt: null,
  ...overrides,
});

const elements = {
  getEmptyStateTitle: () => screen.queryByText("No journal entries yet"),
  getEmptyStateButton: () =>
    screen.queryByRole("link", { name: /write your first entry/i }),
  getTimelineHeader: () => screen.queryByText("Journal Entries"),
  getWriteNewEntryButton: () =>
    screen.queryByRole("link", { name: /write new entry/i }),
  getErrorMessage: () => screen.queryByText(/failed to load journal entries/i),
  getEntryCards: () => screen.queryAllByTestId(/journal-entry-card-/),
};

describe("JournalTimeline", () => {
  let mockFindJournalEntriesByUserId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireServerUserId.mockResolvedValue("user-1");

    mockFindJournalEntriesByUserId = vi.fn();
    mockJournalService.mockImplementation(
      () =>
        ({
          findJournalEntriesByUserId: mockFindJournalEntriesByUserId,
        }) as any
    );

    mockPrisma.game.findMany.mockResolvedValue([]);
  });

  describe("given empty entries result", () => {
    beforeEach(async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue({
        success: true,
        data: [],
      });

      const Component = await JournalTimeline();
      renderWithTestProviders(Component);
    });

    it("should display empty state", () => {
      expect(elements.getEmptyStateTitle()).toBeVisible();
    });

    it("should display 'Write Your First Entry' button", () => {
      expect(elements.getEmptyStateButton()).toBeVisible();
      expect(elements.getEmptyStateButton()).toHaveAttribute(
        "href",
        "/journal/new"
      );
    });

    it("should not display timeline header", () => {
      expect(elements.getTimelineHeader()).not.toBeInTheDocument();
    });
  });

  describe("given entries exist", () => {
    beforeEach(async () => {
      const entries = [
        createMockEntry({ id: "entry-1", title: "Entry 1" }),
        createMockEntry({ id: "entry-2", title: "Entry 2" }),
      ];

      mockFindJournalEntriesByUserId.mockResolvedValue({
        success: true,
        data: entries,
      });

      mockPrisma.game.findMany.mockResolvedValue([
        {
          id: "game-1",
          title: "Game 1",
          slug: "game-1",
          coverImage: "cover1",
        },
        {
          id: "game-2",
          title: "Game 2",
          slug: "game-2",
          coverImage: "cover2",
        },
      ]);

      const Component = await JournalTimeline();
      renderWithTestProviders(Component);
    });

    it("should display timeline header", () => {
      expect(elements.getTimelineHeader()).toBeVisible();
    });

    it("should display 'Write New Entry' button", () => {
      expect(elements.getWriteNewEntryButton()).toBeVisible();
      expect(elements.getWriteNewEntryButton()).toHaveAttribute(
        "href",
        "/journal/new"
      );
    });

    it("should render entry cards", () => {
      expect(elements.getEntryCards()).toHaveLength(2);
    });

    it("should render entries with correct data", () => {
      expect(screen.getByText("Entry 1 - Game 1")).toBeVisible();
      expect(screen.getByText("Entry 2 - Game 2")).toBeVisible();
    });
  });

  describe("given service returns error", () => {
    beforeEach(async () => {
      mockFindJournalEntriesByUserId.mockResolvedValue({
        success: false,
        error: "Failed to fetch entries",
      });

      const Component = await JournalTimeline();
      renderWithTestProviders(Component);
    });

    it("should display error message", () => {
      expect(elements.getErrorMessage()).toBeVisible();
    });

    it("should not display timeline or empty state", () => {
      expect(elements.getTimelineHeader()).not.toBeInTheDocument();
      expect(elements.getEmptyStateTitle()).not.toBeInTheDocument();
    });
  });

  describe("given entry with missing game", () => {
    beforeEach(async () => {
      const entries = [createMockEntry({ id: "entry-1", gameId: "game-1" })];

      mockFindJournalEntriesByUserId.mockResolvedValue({
        success: true,
        data: entries,
      });

      // Game not found in database
      mockPrisma.game.findMany.mockResolvedValue([]);

      const Component = await JournalTimeline();
      renderWithTestProviders(Component);
    });

    it("should skip entries with missing games", () => {
      expect(elements.getEntryCards()).toHaveLength(0);
    });
  });
});
