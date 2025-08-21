import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditorialCollectionNav as CollectionNav } from "./collection-nav";

// Mock Next.js navigation
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

// Mock the ShareWishlist component
vi.mock("@/features/share-wishlist", () => ({
  ShareWishlist: ({ userName }: { userName?: string | null }) => (
    <div data-testid="share-wishlist">
      Share Wishlist {userName ? `for ${userName}` : ""}
    </div>
  ),
}));

const elements = {
  getNavContainer: () => document.querySelector("nav"),
  getNavItemByLabel: (label: string) =>
    screen.getByRole("link", { name: new RegExp(label, "i") }),
  getAllNavItems: () =>
    screen.getAllByRole("link", { name: /My Games|Imported|Wishlist/ }),
  getAddGameButton: () => screen.getByRole("link", { name: /Add Game/i }),
  queryAddGameButton: () => screen.queryByRole("link", { name: /Add Game/i }),
  queryShareWishlistComponent: () => screen.queryByTestId("share-wishlist"),
  getActiveNavItem: () =>
    document.querySelector(
      'a[class*="bg-background"][class*="text-foreground"]'
    ),
  getAllInactiveNavItems: () =>
    document.querySelectorAll('a[class*="hover:bg-background/60"]'),
};

describe("CollectionNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("navigation items", () => {
    beforeEach(() => {
      mockPathname.mockReturnValue("/collection");
    });

    it("should render all navigation items", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      expect(elements.getNavItemByLabel("My Games")).toBeInTheDocument();
      expect(elements.getNavItemByLabel("Imported")).toBeInTheDocument();
      expect(elements.getNavItemByLabel("Wishlist")).toBeInTheDocument();
    });

    it("should render navigation items with correct hrefs", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      expect(elements.getNavItemByLabel("My Games")).toHaveAttribute(
        "href",
        "/collection"
      );
      expect(elements.getNavItemByLabel("Imported")).toHaveAttribute(
        "href",
        "/collection/imported"
      );
      expect(elements.getNavItemByLabel("Wishlist")).toHaveAttribute(
        "href",
        "/collection/wishlist"
      );
    });

    it("should render navigation items with correct titles", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      expect(elements.getNavItemByLabel("My Games")).toHaveAttribute(
        "title",
        "My Games"
      );
      expect(elements.getNavItemByLabel("Imported")).toHaveAttribute(
        "title",
        "Imported"
      );
      expect(elements.getNavItemByLabel("Wishlist")).toHaveAttribute(
        "title",
        "Wishlist"
      );
    });

    it("should render icons for each navigation item", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const navItems = elements.getAllNavItems();
      navItems.forEach((item) => {
        const icon = item.querySelector("svg");
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass("size-4");
      });
    });

    it("should hide labels on small screens and show on larger screens", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const myGamesSpan = elements
        .getNavItemByLabel("My Games")
        .querySelector("span");
      const importedSpan = elements
        .getNavItemByLabel("Imported")
        .querySelector("span");
      const wishlistSpan = elements
        .getNavItemByLabel("Wishlist")
        .querySelector("span");

      expect(myGamesSpan).toHaveClass("hidden", "sm:inline");
      expect(importedSpan).toHaveClass("hidden", "sm:inline");
      expect(wishlistSpan).toHaveClass("hidden", "sm:inline");
    });
  });

  describe("Add Game button", () => {
    beforeEach(() => {
      mockPathname.mockReturnValue("/collection");
    });

    it("should show Add Game button by default", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      expect(elements.getAddGameButton()).toBeInTheDocument();
      expect(elements.getAddGameButton()).toHaveAttribute(
        "href",
        "/collection/add-game"
      );
    });

    it("should show Add Game button when showAddButton is true", () => {
      // Act
      renderWithTestProviders(<CollectionNav showAddButton={true} />);

      // Assert
      expect(elements.getAddGameButton()).toBeInTheDocument();
    });

    it("should hide Add Game button when showAddButton is false", () => {
      // Act
      renderWithTestProviders(<CollectionNav showAddButton={false} />);

      // Assert
      expect(elements.queryAddGameButton()).not.toBeInTheDocument();
    });

    it("should render Add Game button with correct icon", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const button = elements.getAddGameButton();
      const icon = button.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("size-4");
    });
  });

  describe("ShareWishlist component", () => {
    it("should not show ShareWishlist by default", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      expect(elements.queryShareWishlistComponent()).not.toBeInTheDocument();
    });

    it("should pass userName prop to ShareWishlist component", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/wishlist");

      // Act
      renderWithTestProviders(<CollectionNav userName="johndoe" />);

      // Assert
      expect(
        screen.getByText("Share Wishlist for johndoe")
      ).toBeInTheDocument();
    });

    it("should handle null userName", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/wishlist");

      // Act
      renderWithTestProviders(<CollectionNav userName={null} />);

      // Assert
      expect(screen.getByText("Share Wishlist")).toBeInTheDocument();
    });
  });
});
