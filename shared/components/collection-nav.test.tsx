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
  getShareWishlistComponent: () => screen.getByTestId("share-wishlist"),
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
        "Your game collection"
      );
      expect(elements.getNavItemByLabel("Imported")).toHaveAttribute(
        "title",
        "Games from connected services"
      );
      expect(elements.getNavItemByLabel("Wishlist")).toHaveAttribute(
        "title",
        "Games you want to play"
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

  describe("active state logic", () => {
    it("should mark My Games as active when on /collection", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const myGamesLink = elements.getNavItemByLabel("My Games");
      expect(myGamesLink).toHaveClass(
        "bg-background",
        "text-foreground",
        "shadow-sm"
      );
    });

    it("should mark Imported as active when on /collection/imported", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/imported");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const importedLink = elements.getNavItemByLabel("Imported");
      expect(importedLink).toHaveClass(
        "bg-background",
        "text-foreground",
        "shadow-sm"
      );
    });

    it("should mark Wishlist as active when on /collection/wishlist", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/wishlist");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const wishlistLink = elements.getNavItemByLabel("Wishlist");
      expect(wishlistLink).toHaveClass(
        "bg-background",
        "text-foreground",
        "shadow-sm"
      );
    });

    it("should only mark My Games as active for exact /collection path", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/some-other-page");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const myGamesLink = elements.getNavItemByLabel("My Games");
      expect(myGamesLink).not.toHaveClass(
        "bg-background",
        "text-foreground",
        "shadow-sm"
      );
    });

    it("should mark Imported as active for paths starting with /collection/imported", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/imported/subpage");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const importedLink = elements.getNavItemByLabel("Imported");
      expect(importedLink).toHaveClass(
        "bg-background",
        "text-foreground",
        "shadow-sm"
      );
    });

    it("should apply inactive styles to non-active items", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection");

      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const importedLink = elements.getNavItemByLabel("Imported");
      const wishlistLink = elements.getNavItemByLabel("Wishlist");

      expect(importedLink).toHaveClass("hover:bg-background/60");
      expect(wishlistLink).toHaveClass("hover:bg-background/60");
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

    it("should show ShareWishlist when showShareWishlist is true", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection");

      // Act
      renderWithTestProviders(<CollectionNav userName="testuser" />);

      // Assert
      expect(elements.getShareWishlistComponent()).toBeInTheDocument();
      expect(
        screen.getByText("Share Wishlist for testuser")
      ).toBeInTheDocument();
    });

    it("should show ShareWishlist when on wishlist page regardless of showShareWishlist prop", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/wishlist");

      // Act
      renderWithTestProviders(<CollectionNav userName="testuser" />);

      // Assert
      expect(elements.getShareWishlistComponent()).toBeInTheDocument();
    });

    it("should show ShareWishlist when pathname starts with /collection/wishlist", () => {
      // Arrange
      mockPathname.mockReturnValue("/collection/wishlist/subpage");

      // Act
      renderWithTestProviders(<CollectionNav userName="testuser" />);

      // Assert
      expect(elements.getShareWishlistComponent()).toBeInTheDocument();
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

  describe("layout and responsive design", () => {
    beforeEach(() => {
      mockPathname.mockReturnValue("/collection");
    });

    it("should have responsive layout classes", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const container = document.querySelector(
        ".flex.flex-col.gap-4.sm\\:flex-row"
      );
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("sm:items-center", "sm:justify-between");
    });

    it("should have muted background navigation container", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const nav = elements.getNavContainer();
      expect(nav).toHaveClass(
        "flex",
        "w-fit",
        "gap-1",
        "rounded-lg",
        "bg-muted",
        "p-1"
      );
    });

    it("should have consistent button sizing and spacing", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const navItems = elements.getAllNavItems();
      navItems.forEach((item) => {
        expect(item).toHaveClass(
          "flex",
          "items-center",
          "gap-2",
          "px-3",
          "py-2"
        );
      });
    });
  });

  describe("accessibility", () => {
    beforeEach(() => {
      mockPathname.mockReturnValue("/collection");
    });

    it("should have accessible navigation structure", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const nav = elements.getNavContainer();
      expect(nav).toBeInTheDocument();
      expect(nav?.tagName.toLowerCase()).toBe("nav");
    });

    it("should have descriptive title attributes", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const navItems = elements.getAllNavItems();
      navItems.forEach((item) => {
        expect(item).toHaveAttribute("title");
      });
    });

    it("should have proper link roles", () => {
      // Act
      renderWithTestProviders(<CollectionNav />);

      // Assert
      const allLinks = [
        ...elements.getAllNavItems(),
        elements.getAddGameButton(),
      ];

      allLinks.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });
});
