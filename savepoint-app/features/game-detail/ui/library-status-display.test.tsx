import { LibraryItemStatus } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LibraryStatusDisplay } from "./library-status-display";

const defaultProps = {
  igdbId: 12345,
  gameTitle: "Test Game",
};

describe("LibraryStatusDisplay", () => {
  describe("No library status", () => {
    it("should display 'Add to Library' button when userLibraryStatus is undefined", () => {
      render(
        <LibraryStatusDisplay {...defaultProps} userLibraryStatus={undefined} />
      );

      expect(screen.getByText("Add to Library")).toBeInTheDocument();
      expect(screen.getByText("Library Status")).toBeInTheDocument();
      expect(
        screen.getByText("Add this game to your library")
      ).toBeInTheDocument();
    });

    it("should show Add to Library button (not disabled)", () => {
      render(
        <LibraryStatusDisplay {...defaultProps} userLibraryStatus={undefined} />
      );

      const button = screen.getByRole("button", {
        name: `Add ${defaultProps.gameTitle} to your library`,
      });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("should not show placeholder text anymore", () => {
      render(
        <LibraryStatusDisplay {...defaultProps} userLibraryStatus={undefined} />
      );

      expect(
        screen.queryByText("Coming soon in Slice 14")
      ).not.toBeInTheDocument();
    });
  });

  describe("With library status", () => {
    it("should display status label for CURIOUS_ABOUT", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURIOUS_ABOUT },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Curious About")).toBeInTheDocument();
    });

    it("should display status label for CURRENTLY_EXPLORING", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Currently Exploring")).toBeInTheDocument();
    });

    it("should display status label for TOOK_A_BREAK", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.TOOK_A_BREAK },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Taking a Break")).toBeInTheDocument();
    });

    it("should display status label for EXPERIENCED", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.EXPERIENCED },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Experienced")).toBeInTheDocument();
    });

    it("should display status label for WISHLIST", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.WISHLIST },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Wishlist")).toBeInTheDocument();
    });

    it("should display status label for REVISITING", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.REVISITING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Revisiting")).toBeInTheDocument();
    });

    it("should format and display updated date correctly", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText(/Updated: Jan 15, 2023/)).toBeInTheDocument();
    });

    it("should display Manage Library button when status exists", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText("Manage Library")).toBeInTheDocument();
    });

    it("should enable Manage Library button", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      const button = screen.getByRole("button", { name: /manage library/i });
      expect(button).not.toBeDisabled();
    });

    it("should render status icon", () => {
      const { container } = render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      // lucide-react icons render as SVG elements
      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should not display 'Add to Library' button when status exists", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.CURRENTLY_EXPLORING },
            updatedAt: new Date("2023-01-15"),
            allItems: [],
          }}
        />
      );

      expect(
        screen.queryByText("Add this game to your library")
      ).not.toBeInTheDocument();
    });
  });

  describe("Date formatting", () => {
    it("should format date with correct month abbreviation", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.WISHLIST },
            updatedAt: new Date("2023-12-25"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText(/Updated: Dec 25, 2023/)).toBeInTheDocument();
    });

    it("should handle different year correctly", () => {
      render(
        <LibraryStatusDisplay
          {...defaultProps}
          userLibraryStatus={{
            mostRecent: { status: LibraryItemStatus.WISHLIST },
            updatedAt: new Date("2024-03-10"),
            allItems: [],
          }}
        />
      );

      expect(screen.getByText(/Updated: Mar 10, 2024/)).toBeInTheDocument();
    });
  });
});
