import type { LibraryItem } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LibraryEntryMetadata } from "./library-entry-metadata";

vi.mock("@/shared/lib/date", () => ({
  formatRelativeDate: vi.fn((date: Date) => {
    const now = new Date("2025-01-27T12:00:00Z");
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }),
}));

const createMockLibraryItem = (
  overrides: Partial<LibraryItem> = {}
): LibraryItem => ({
  id: 1,
  userId: "user1",
  gameId: "game1",
  status: "CURIOUS_ABOUT",
  platform: "PC",
  acquisitionType: "DIGITAL",
  createdAt: new Date("2025-01-27T12:00:00Z"),
  updatedAt: new Date("2025-01-27T12:00:00Z"),
  startedAt: null,
  completedAt: null,
  ...overrides,
});

const elements = {
  getCreatedLabel: () => screen.getByText("Created:"),
  getCreatedDate: () =>
    screen.getByText(/today|yesterday|\d+ days ago|[A-Z][a-z]{2} \d+, \d{4}/),
  getUpdatedLabel: () => screen.queryByText("Last updated:"),
  getUpdatedDate: () =>
    screen.getByText(/today|yesterday|\d+ days ago|[A-Z][a-z]{2} \d+, \d{4}/, {
      selector: "span.font-medium",
    }),
  getPlatformLabel: () => screen.queryByText("Platform:"),
  getPlatformValue: (platform: string) => screen.getByText(platform),
};

describe("LibraryEntryMetadata", () => {
  describe("given item with same created and updated dates", () => {
    it("should display created date", () => {
      const item = createMockLibraryItem();
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getCreatedLabel()).toBeInTheDocument();
      expect(screen.getByText("today")).toBeInTheDocument();
    });

    it("should not display updated date when same as created", () => {
      const item = createMockLibraryItem();
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getUpdatedLabel()).not.toBeInTheDocument();
    });
  });

  describe("given item with different created and updated dates", () => {
    it("should display both created and updated dates", () => {
      const item = createMockLibraryItem({
        createdAt: new Date("2025-01-20T12:00:00Z"),
        updatedAt: new Date("2025-01-27T12:00:00Z"),
        startedAt: null,
        completedAt: null,
      });

      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getCreatedLabel()).toBeInTheDocument();
      expect(elements.getUpdatedLabel()).toBeInTheDocument();
    });

    it("should format created date as relative time", () => {
      const item = createMockLibraryItem({
        createdAt: new Date("2025-01-24T12:00:00Z"),
        updatedAt: new Date("2025-01-27T12:00:00Z"),
        startedAt: null,
        completedAt: null,
      });

      render(<LibraryEntryMetadata item={item} />);

      expect(screen.getByText("3 days ago")).toBeInTheDocument();
    });

    it("should format updated date as relative time", () => {
      const item = createMockLibraryItem({
        createdAt: new Date("2025-01-20T12:00:00Z"),
        updatedAt: new Date("2025-01-27T12:00:00Z"),
        startedAt: null,
        completedAt: null,
      });

      render(<LibraryEntryMetadata item={item} />);

      expect(screen.getByText("today")).toBeInTheDocument();
    });
  });

  describe("given item with platform", () => {
    it("should display platform label and value", () => {
      const item = createMockLibraryItem({ platform: "Nintendo Switch" });
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getPlatformLabel()).toBeInTheDocument();
      expect(elements.getPlatformValue("Nintendo Switch")).toBeInTheDocument();
    });

    it("should display PC platform", () => {
      const item = createMockLibraryItem({ platform: "PC" });
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getPlatformValue("PC")).toBeInTheDocument();
    });

    it("should display PlayStation 5 platform", () => {
      const item = createMockLibraryItem({ platform: "PlayStation 5" });
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getPlatformValue("PlayStation 5")).toBeInTheDocument();
    });
  });

  describe("given item without platform", () => {
    it("should not display platform section when platform is null", () => {
      const item = createMockLibraryItem({ platform: null });
      render(<LibraryEntryMetadata item={item} />);

      expect(elements.getPlatformLabel()).not.toBeInTheDocument();
    });
  });

  describe("layout and styling", () => {
    it("should render in a bordered card with muted background", () => {
      const item = createMockLibraryItem();
      const { container } = render(<LibraryEntryMetadata item={item} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("bg-muted/50");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("rounded-lg");
    });

    it("should use flex layout for label-value pairs", () => {
      const item = createMockLibraryItem();
      render(<LibraryEntryMetadata item={item} />);

      const createdContainer = elements.getCreatedLabel().closest("div");
      expect(createdContainer).toHaveClass("flex");
      expect(createdContainer).toHaveClass("justify-between");
    });
  });
});
