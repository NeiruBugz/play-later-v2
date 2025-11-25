import { renderWithTestProviders } from "@/test/utils/test-provider";
import { LibraryItemStatus } from "@/shared/types";
import { createLibraryItemFixture } from "@fixtures/library";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LibraryCard } from "./library-card";

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

vi.mock("../server-actions/update-library-status", () => ({
  updateLibraryStatusAction: vi.fn(),
}));

vi.mock("../hooks/use-quick-actions-variant", () => ({
  useQuickActionsVariant: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const elements = {
  getCoverImage: () => screen.getByRole("img"),
  getStatusBadge: (status: string) =>
    screen.getByLabelText(`Status: ${status}`),
  getCountBadge: () => screen.queryByText(/\d+ entries/i),
  getActionBar: () => screen.queryByRole("toolbar", { name: /change status/i }),
  getGameTitle: () =>
    screen.queryByText("The Legend of Zelda: Breath of the Wild"),
};

describe("LibraryCard", () => {
  describe("given card displays game cover image", () => {
    it("should display game cover image with correct src", () => {
      const item = createLibraryItemFixture();
      renderWithTestProviders(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toBeVisible();
      expect(image).toHaveAttribute(
        "src",
        "https://images.igdb.com/igdb/image/upload/t_720p/co1234.jpg"
      );
    });

    it("should have correct alt text for accessibility", () => {
      const item = createLibraryItemFixture();
      renderWithTestProviders(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "alt",
        "The Legend of Zelda: Breath of the Wild cover"
      );
    });

    it("should have correct image sizes for responsive loading", () => {
      const item = createLibraryItemFixture();
      renderWithTestProviders(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "data-sizes",
        "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
      );
    });

    it("should display placeholder when game has no cover image", () => {
      const item = createLibraryItemFixture({
        game: {
          ...createLibraryItemFixture().game,
          coverImage: null,
        },
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(screen.getByText("No Cover")).toBeVisible();
    });
  });

  describe("given card displays status badge", () => {
    it("should show status badge for CURIOUS_ABOUT", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Curious About")).toBeVisible();
    });

    it("should show status badge for CURRENTLY_EXPLORING", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Currently Exploring")).toBeVisible();
    });

    it("should show status badge for TOOK_A_BREAK", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.TOOK_A_BREAK,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Taking a Break")).toBeVisible();
    });

    it("should show status badge for EXPERIENCED", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.EXPERIENCED,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Experienced")).toBeVisible();
    });

    it("should show status badge for WISHLIST", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.WISHLIST,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Wishlist")).toBeVisible();
    });

    it("should show status badge for REVISITING", () => {
      const item = createLibraryItemFixture({
        status: LibraryItemStatus.REVISITING,
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Revisiting")).toBeVisible();
    });
  });

  describe("given game has multiple library entries", () => {
    it("should show count badge when multiple entries exist", () => {
      const item = createLibraryItemFixture({
        game: {
          ...createLibraryItemFixture().game,
          entryCount: 3,
        },
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      const countBadge = elements.getCountBadge();
      expect(countBadge).toBeVisible();
      expect(countBadge).toHaveTextContent("3 entries");
    });

    it("should format count badge text correctly", () => {
      const item = createLibraryItemFixture({
        game: {
          ...createLibraryItemFixture().game,
          entryCount: 2,
        },
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      const countBadge = elements.getCountBadge();
      expect(countBadge).toBeVisible();
      expect(countBadge).toHaveTextContent("2 entries");
    });

    it("should hide count badge when only one entry exists", () => {
      const item = createLibraryItemFixture({
        game: {
          ...createLibraryItemFixture().game,
          entryCount: 1,
        },
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getCountBadge()).not.toBeInTheDocument();
    });
  });

  describe("given user hovers over card", () => {
    it("should show game title on hover", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      const title = elements.getGameTitle();
      expect(title).toBeInTheDocument();
    });

    it("should display game title in tooltip on hover", async () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      const titleElement = screen.getByText(
        "The Legend of Zelda: Breath of the Wild"
      );
      await userEvent.hover(titleElement);

      const titleElements = screen.getAllByText(
        "The Legend of Zelda: Breath of the Wild"
      );
      expect(titleElements.length).toBeGreaterThan(0);
    });
  });

  describe("given card displays quick actions", () => {
    it("should render action bar", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getActionBar()).toBeInTheDocument();
    });

    it("should have accessible label for action bar", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      const actionBar = elements.getActionBar();
      expect(actionBar).toHaveAccessibleName(/change status/i);
    });
  });

  describe("given card layout and styling", () => {
    it("should render cover image with correct alt text", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      const image = elements.getCoverImage();
      expect(image).toHaveAttribute(
        "alt",
        "The Legend of Zelda: Breath of the Wild cover"
      );
    });

    it("should display status badge", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getStatusBadge("Currently Exploring")).toBeVisible();
    });

    it("should display count badge when multiple entries exist", () => {
      const item = createLibraryItemFixture({
        game: {
          ...createLibraryItemFixture().game,
          entryCount: 2,
        },
      });

      renderWithTestProviders(<LibraryCard item={item} />);

      expect(elements.getCountBadge()).toBeVisible();
    });

    it("should have hover effect classes on image", () => {
      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

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

      const item = createLibraryItemFixture();

      renderWithTestProviders(<LibraryCard item={item} />);

      const actionBar = elements.getActionBar();
      expect(actionBar).toHaveClass("absolute", "inset-x-0", "bottom-0");
    });
  });
});
