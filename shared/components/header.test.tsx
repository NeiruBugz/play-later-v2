import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./header";

// Mock the feature components
vi.mock("@/features/manage-user-info/components/user", () => ({
  User: () => <div data-testid="user-component">User Component</div>,
}));

vi.mock("@/features/theme-toggle/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

const elements = {
  getHeader: () => screen.getByRole("banner"),
  getLogo: () => screen.getByRole("link", { name: /PlayLater|PL/ }),
  getLogoIcon: () => elements.getLogo().querySelector("svg"),
  getLogoText: () => screen.queryByText("PlayLater"),
  getLogoShortText: () => screen.queryByText("PL"),
  getMobileMenuButton: () =>
    screen.queryByRole("button", { name: /Toggle menu/i }),
  getDesktopNav: () => document.querySelector("nav"),
  getCollectionLink: () => screen.queryByRole("link", { name: /Collection/ }),
  getBacklogsLink: () => screen.queryByRole("link", { name: /Backlogs/ }),
  getAddGameButton: () => screen.queryByRole("link", { name: /Add Game/ }),
  getUserComponent: () => screen.queryByTestId("user-component"),
  getThemeToggle: () => screen.queryByTestId("theme-toggle"),
  getAllNavigationLinks: () =>
    screen.queryAllByRole("link", { name: /Collection|Backlogs/ }),
  queryMobileMenuButton: () =>
    screen.queryByRole("button", { name: /Toggle menu/i }),
  queryDesktopNav: () => document.querySelector("nav"),
  queryAddGameButton: () => screen.queryByRole("link", { name: /Add Game/ }),
  queryUserComponent: () => screen.queryByTestId("user-component"),
  queryThemeToggle: () => screen.queryByTestId("theme-toggle"),
};

describe("Header", () => {
  describe("when user is authorized", () => {
    it("should render the header with all authorized elements", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      expect(elements.getHeader()).toBeInTheDocument();
      expect(elements.getLogo()).toBeInTheDocument();
      expect(elements.getMobileMenuButton()).toBeInTheDocument();
      expect(elements.getDesktopNav()).toBeInTheDocument();
      expect(elements.getAddGameButton()).toBeInTheDocument();
      expect(elements.getUserComponent()).toBeInTheDocument();
      expect(elements.getThemeToggle()).toBeInTheDocument();
    });

    it("should render the logo with correct link and icon", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const logo = elements.getLogo();
      expect(logo).toHaveAttribute("href", "/");

      const icon = elements.getLogoIcon();
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("size-5", "text-green-500", "sm:size-6");
    });

    it("should show full logo text on larger screens and short text on mobile", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const fullText = elements.getLogoText();
      const shortText = elements.getLogoShortText();

      expect(fullText).toBeInTheDocument();
      expect(fullText).toHaveClass("hidden", "sm:inline-block");

      expect(shortText).toBeInTheDocument();
      expect(shortText).toHaveClass("sm:hidden");
    });

    it("should render mobile menu button for authorized users", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const mobileButton = elements.getMobileMenuButton();
      expect(mobileButton).toBeInTheDocument();
      expect(mobileButton?.closest("div")).toHaveClass(
        "mr-4",
        "flex",
        "md:hidden"
      );
    });

    it("should render desktop navigation with correct links", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const nav = elements.getDesktopNav();
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass("hidden", "md:flex");

      const collectionLink = elements.getCollectionLink();
      const backlogsLink = elements.getBacklogsLink();

      expect(collectionLink).toBeInTheDocument();
      expect(collectionLink).toHaveAttribute(
        "href",
        "/collection?status=PLAYING&page=1"
      );

      expect(backlogsLink).toBeInTheDocument();
      expect(backlogsLink).toHaveAttribute("href", "/backlog");
    });

    it("should render Add Game button with correct link", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const addButton = elements.getAddGameButton();
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute("href", "/collection/add-game");

      // Check for Plus icon
      const icon = addButton?.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("size-4");
    });

    it("should hide Add Game text on mobile screens", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const addButton = elements.getAddGameButton();
      const buttonText = addButton?.querySelector("span");
      expect(buttonText).toHaveClass("hidden", "sm:inline");
    });

    it("should render User and ThemeToggle components", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      expect(elements.getUserComponent()).toBeInTheDocument();
      expect(elements.getThemeToggle()).toBeInTheDocument();
    });

    it("should have proper header styling and backdrop", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const header = elements.getHeader();
      expect(header).toHaveClass(
        "fixed",
        "top-0",
        "z-20",
        "w-full",
        "border-b",
        "bg-background/95",
        "backdrop-blur"
      );
    });

    it("should render navigation links with icons", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const navLinks = elements.getAllNavigationLinks();
      navLinks.forEach((link) => {
        const icon = link.querySelector("svg");
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass("size-4");
      });
    });

    it("should hide navigation labels on smaller screens", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const collectionLink = elements.getCollectionLink();
      const backlogsLink = elements.getBacklogsLink();

      const collectionSpan = collectionLink?.querySelector("span");
      const backlogsSpan = backlogsLink?.querySelector("span");

      expect(collectionSpan).toHaveClass("hidden", "lg:inline");
      expect(backlogsSpan).toHaveClass("hidden", "lg:inline");
    });

    describe("mobile menu functionality", () => {
      it("should render mobile menu with dropdown trigger", () => {
        // Act
        renderWithTestProviders(<Header authorized={true} />);

        // Assert - dropdown trigger should be present
        // Testing actual dropdown opening would require more complex setup
        const mobileButton = elements.getMobileMenuButton();
        expect(mobileButton).toBeInTheDocument();
        expect(mobileButton).toHaveAttribute("aria-haspopup");
      });
    });
  });

  describe("when user is not authorized", () => {
    it("should render only the logo without authorized elements", () => {
      // Act
      renderWithTestProviders(<Header authorized={false} />);

      // Assert
      expect(elements.getHeader()).toBeInTheDocument();
      expect(elements.getLogo()).toBeInTheDocument();

      // Should not render authorized-only elements
      expect(elements.queryMobileMenuButton()).not.toBeInTheDocument();
      expect(elements.queryDesktopNav()).not.toBeInTheDocument();
      expect(elements.queryAddGameButton()).not.toBeInTheDocument();
      expect(elements.queryUserComponent()).not.toBeInTheDocument();
      expect(elements.queryThemeToggle()).not.toBeInTheDocument();
    });

    it("should still show logo with correct styling", () => {
      // Act
      renderWithTestProviders(<Header authorized={false} />);

      // Assert
      const logo = elements.getLogo();
      expect(logo).toHaveAttribute("href", "/");

      const icon = elements.getLogoIcon();
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("size-5", "text-green-500", "sm:size-6");
    });

    it("should maintain header structure without navigation", () => {
      // Act
      renderWithTestProviders(<Header authorized={false} />);

      // Assert
      const header = elements.getHeader();
      expect(header).toHaveClass(
        "fixed",
        "top-0",
        "z-20",
        "w-full",
        "border-b",
        "bg-background/95",
        "backdrop-blur"
      );

      // Container should still be present
      const container = header.querySelector(".container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass(
        "flex",
        "h-14",
        "max-w-screen-2xl",
        "items-center"
      );
    });
  });

  describe("responsive design", () => {
    it("should have responsive logo sizing", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const icon = elements.getLogoIcon();
      expect(icon).toHaveClass("size-5", "sm:size-6");
    });

    it("should have responsive navigation visibility", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const mobileButton = elements.getMobileMenuButton();
      const desktopNav = elements.getDesktopNav();

      expect(mobileButton?.closest("div")).toHaveClass("md:hidden");
      expect(desktopNav).toHaveClass("hidden", "md:flex");
    });

    it("should have responsive spacing and sizing", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const nav = elements.getDesktopNav();
      expect(nav).toHaveClass("space-x-2", "lg:space-x-4");

      const collectionLink = elements.getCollectionLink();
      expect(collectionLink).toHaveClass("h-8", "px-2", "lg:px-3");
    });
  });

  describe("accessibility", () => {
    it("should have proper semantic header structure", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const header = elements.getHeader();
      expect(header.tagName.toLowerCase()).toBe("header");
    });

    it("should have screen reader text for mobile menu", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const srText = document.querySelector(".sr-only");
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveTextContent("Toggle menu");
    });

    it("should have proper navigation semantics", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const nav = elements.getDesktopNav();
      expect(nav?.tagName.toLowerCase()).toBe("nav");
    });

    it("should have proper link accessibility", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      const allLinks = [
        elements.getLogo(),
        elements.getCollectionLink(),
        elements.getBacklogsLink(),
        elements.getAddGameButton(),
      ].filter(Boolean);

      allLinks.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });
  });

  describe("component integration", () => {
    it("should properly integrate User component", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      expect(elements.getUserComponent()).toBeInTheDocument();
      expect(elements.getUserComponent()).toHaveTextContent("User Component");
    });

    it("should properly integrate ThemeToggle component", () => {
      // Act
      renderWithTestProviders(<Header authorized={true} />);

      // Assert
      expect(elements.getThemeToggle()).toBeInTheDocument();
      expect(elements.getThemeToggle()).toHaveTextContent("Theme Toggle");
    });
  });
});
