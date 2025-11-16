import { LibraryItemStatus } from "@prisma/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { LibraryItemWithGameAndCount } from "../hooks/use-library-data";
import { LibraryCard } from "./library-card";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, sizes, className }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      data-sizes={sizes}
      className={className}
    />
  ),
}));

// Mock the server action
vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: vi.fn(),
}));

// Mock the A/B test hook to control which variant is rendered
vi.mock("../hooks/use-quick-actions-variant", () => ({
  useQuickActionsVariant: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Helper to create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

// Helper to render component with QueryClient wrapper
const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const mockLibraryItem = (
  overrides?: Partial<LibraryItemWithGameAndCount>
): LibraryItemWithGameAndCount => ({
  id: 1,
  userId: "user-123",
  gameId: "game-123",
  status: "CURRENTLY_EXPLORING",
  platform: "PlayStation 5",
  acquisitionType: "DIGITAL",
  startedAt: new Date("2025-01-15"),
  completedAt: null,
  createdAt: new Date("2025-01-10"),
  updatedAt: new Date("2025-01-20"),
  game: {
    id: "game-123",
    title: "The Legend of Zelda: Breath of the Wild",
    coverImage:
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
    slug: "the-legend-of-zelda-breath-of-the-wild",
    releaseDate: new Date("2017-03-03"),
    _count: {
      libraryItems: 1,
    },
  },
  ...overrides,
});

const elements = {
  getCoverImage: () => screen.getByRole("img"),
  getStatusBadge: () =>
    screen.getByText(
      /Currently Exploring|Curious About|Wishlist|Experienced|Took a Break|Revisiting/i
    ),
  getCountBadge: () => screen.queryByText(/\d+ entries/i),
  // Variant A: Interactive badge (clickable button)
  getInteractiveBadgeButton: () =>
    screen.queryByRole("button", { name: /change status/i }),
  // Variant B: Action bar (toolbar with multiple buttons)
  getActionBar: () => screen.queryByRole("toolbar", { name: /change status/i }),
  getGameTitle: () =>
    screen.queryByText("The Legend of Zelda: Breath of the Wild"),
};

describe("LibraryCard", () => {
  beforeEach(async () => {
    // Default to badge variant for all tests unless overridden
    const { useQuickActionsVariant } = await import(
      "../hooks/use-quick-actions-variant"
    );
    vi.mocked(useQuickActionsVariant).mockReturnValue("badge");
  });

  describe("given card displays game cover image", () => {
    it("should display game cover image with correct src", () => {
      const item = mockLibraryItem();
      renderWithQueryClient(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toBeVisible();
      expect(image).toHaveAttribute(
        "src",
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg"
      );
    });

    it("should have correct alt text for accessibility", () => {
      const item = mockLibraryItem();
      renderWithQueryClient(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "alt",
        "The Legend of Zelda: Breath of the Wild cover"
      );
    });

    it("should have correct image sizes for responsive loading", () => {
      const item = mockLibraryItem();
      renderWithQueryClient(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "data-sizes",
        "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
      );
    });

    it("should display placeholder when game has no cover image", () => {
      const item = mockLibraryItem({
        game: {
          ...mockLibraryItem().game,
          coverImage: null,
        },
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(screen.getByText("No Cover")).toBeVisible();
    });
  });

  describe("given card displays status badge", () => {
    it("should show status badge for CURIOUS_ABOUT", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent("Curious About");
      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should show status badge for CURRENTLY_EXPLORING", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent(
        "Currently Exploring"
      );
      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should show status badge for TOOK_A_BREAK", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.TOOK_A_BREAK,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent("Took a Break");
      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should show status badge for EXPERIENCED", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.EXPERIENCED,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent("Experienced");
      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should show status badge for WISHLIST", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.WISHLIST,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent("Wishlist");
      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should show status badge for REVISITING", () => {
      const item = mockLibraryItem({
        status: LibraryItemStatus.REVISITING,
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toHaveTextContent("Revisiting");
      expect(elements.getStatusBadge()).toBeVisible();
    });
  });

  describe("given game has multiple library entries", () => {
    it("should show count badge when multiple entries exist", () => {
      const item = mockLibraryItem({
        game: {
          ...mockLibraryItem().game,
          _count: {
            libraryItems: 3,
          },
        },
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      const countBadge = elements.getCountBadge();
      expect(countBadge).toBeVisible();
      expect(countBadge).toHaveTextContent("3 entries");
    });

    it("should format count badge text correctly", () => {
      const item = mockLibraryItem({
        game: {
          ...mockLibraryItem().game,
          _count: {
            libraryItems: 2,
          },
        },
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      const countBadge = elements.getCountBadge();
      expect(countBadge).toBeVisible();
      expect(countBadge).toHaveTextContent("2 entries");
    });

    it("should hide count badge when only one entry exists", () => {
      const item = mockLibraryItem({
        game: {
          ...mockLibraryItem().game,
          _count: {
            libraryItems: 1,
          },
        },
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getCountBadge()).not.toBeInTheDocument();
    });
  });

  describe("given user hovers over card", () => {
    it("should show game title on hover", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      // Title should be in the document (in overlay)
      const title = elements.getGameTitle();
      expect(title).toBeInTheDocument();
    });

    it("should display game title in tooltip on hover", async () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      // Find the overlay element that triggers the tooltip
      const titleElement = screen.getByText(
        "The Legend of Zelda: Breath of the Wild"
      );
      await userEvent.hover(titleElement);

      // Tooltip should appear with game title
      // Note: Tooltip content might be in a portal, so we check for multiple instances
      const titleElements = screen.getAllByText(
        "The Legend of Zelda: Breath of the Wild"
      );
      expect(titleElements.length).toBeGreaterThan(0);
    });
  });

  describe("given card displays quick actions - Variant A (Interactive Badge)", () => {
    beforeEach(async () => {
      const { useQuickActionsVariant } = await import(
        "../hooks/use-quick-actions-variant"
      );
      vi.mocked(useQuickActionsVariant).mockReturnValue("badge");
    });

    it("should render interactive badge button", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getInteractiveBadgeButton()).toBeInTheDocument();
    });

    it("should have accessible label for interactive badge button", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      const button = elements.getInteractiveBadgeButton();
      expect(button).toHaveAccessibleName(/change status/i);
    });

    it("should not render action bar", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getActionBar()).not.toBeInTheDocument();
    });
  });

  describe("given card displays quick actions - Variant B (Action Bar)", () => {
    beforeEach(async () => {
      const { useQuickActionsVariant } = await import(
        "../hooks/use-quick-actions-variant"
      );
      vi.mocked(useQuickActionsVariant).mockReturnValue("actionBar");
    });

    it("should render action bar", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getActionBar()).toBeInTheDocument();
    });

    it("should have accessible label for action bar", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      const actionBar = elements.getActionBar();
      expect(actionBar).toHaveAccessibleName(/change status/i);
    });

    it("should not render interactive badge button", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getInteractiveBadgeButton()).not.toBeInTheDocument();
    });
  });

  describe("given card layout and styling", () => {
    beforeEach(async () => {
      const { useQuickActionsVariant } = await import(
        "../hooks/use-quick-actions-variant"
      );
      // Default to badge variant for these tests
      vi.mocked(useQuickActionsVariant).mockReturnValue("badge");
    });

    it("should render cover image with correct alt text", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "alt",
        "The Legend of Zelda: Breath of the Wild cover"
      );
    });

    it("should display status badge", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getStatusBadge()).toBeVisible();
    });

    it("should display count badge when multiple entries exist", () => {
      const item = mockLibraryItem({
        game: {
          ...mockLibraryItem().game,
          _count: {
            libraryItems: 2,
          },
        },
      });

      renderWithQueryClient(<LibraryCard item={item} />);

      expect(elements.getCountBadge()).toBeVisible();
    });

    it("should have hover effect classes on image", () => {
      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveClass(
        "transition-transform",
        "duration-300",
        "group-hover:scale-105"
      );
    });

    it("should position action bar at bottom when using actionBar variant", async () => {
      const { useQuickActionsVariant } = await import(
        "../hooks/use-quick-actions-variant"
      );
      vi.mocked(useQuickActionsVariant).mockReturnValue("actionBar");

      const item = mockLibraryItem();

      renderWithQueryClient(<LibraryCard item={item} />);

      const actionBar = elements.getActionBar();
      expect(actionBar).toHaveClass("absolute", "inset-x-0", "bottom-0");
    });
  });
});
