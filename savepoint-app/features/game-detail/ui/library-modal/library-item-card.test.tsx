import { LibraryItemStatus, type LibraryItem } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatAbsoluteDate } from "@/shared/lib/date";

import { LibraryItemCard } from "./library-item-card";

vi.mock("@/shared/lib/date", () => ({
  formatAbsoluteDate: vi.fn((date: Date) => {
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
  userId: "user-123",
  gameId: "game-456",
  status: LibraryItemStatus.CURIOUS_ABOUT,
  platform: "PlayStation 5",
  acquisitionType: "DIGITAL",
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2025-01-10T12:00:00Z"),
  updatedAt: new Date("2025-01-20T12:00:00Z"),
  ...overrides,
});

const elements = {
  getCard: () => screen.getByRole("button"),
  getPlatformText: (platform: string) =>
    screen.getByText(new RegExp(platform, "i")),
  getStatusBadge: (status: string) => screen.getByText(status),
  getStartedDate: () => screen.getByText(/started:/i),
  getCompletedDate: () => screen.getByText(/completed:/i),
  getCreatedDate: () => screen.getByText(/added:/i),
  getUpdatedDate: () => screen.getByText(/updated:/i),
  queryCard: () => screen.queryByRole("button"),
};

describe("LibraryItemCard", () => {
  describe("Rendering Tests", () => {
    describe("given item with platform set", () => {
      it("should display platform name with icon", () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getPlatformText("PlayStation 5")).toBeVisible();
      });

      it("should display PC platform correctly", () => {
        const item = createMockLibraryItem({ platform: "PC" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getPlatformText("PC")).toBeVisible();
      });

      it("should display Nintendo Switch platform correctly", () => {
        const item = createMockLibraryItem({ platform: "Nintendo Switch" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getPlatformText("Nintendo Switch")).toBeVisible();
      });
    });

    describe("given item with no platform", () => {
      it("should display fallback message", () => {
        const item = createMockLibraryItem({ platform: null });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText("🎮 Platform not set")).toBeVisible();
      });
    });

    describe("given item with different statuses", () => {
      it("should show 'Curious About' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.CURIOUS_ABOUT,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Curious About")).toBeVisible();
      });

      it("should show 'Currently Exploring' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Currently Exploring")).toBeVisible();
      });

      it("should show 'Experienced' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.EXPERIENCED,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Experienced")).toBeVisible();
      });

      it("should show 'Taking a Break' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.TOOK_A_BREAK,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Taking a Break")).toBeVisible();
      });

      it("should show 'Wishlist' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.WISHLIST,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Wishlist")).toBeVisible();
      });

      it("should show 'Revisiting' status badge", () => {
        const item = createMockLibraryItem({
          status: LibraryItemStatus.REVISITING,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getStatusBadge("Revisiting")).toBeVisible();
      });
    });

    describe("given item with startedAt date", () => {
      it("should show formatted started date", () => {
        const startedDate = new Date("2025-01-15T12:00:00Z");
        const item = createMockLibraryItem({ startedAt: startedDate });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const startedSection = elements.getStartedDate();
        expect(startedSection).toBeVisible();
        expect(startedSection).toHaveTextContent("Jan 15, 2025");
      });

      it("should include time element with dateTime attribute", () => {
        const startedDate = new Date("2025-01-15T12:00:00Z");
        const item = createMockLibraryItem({ startedAt: startedDate });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const timeElement = screen.getByText("Jan 15, 2025");
        expect(timeElement.tagName).toBe("TIME");
        expect(timeElement).toHaveAttribute(
          "dateTime",
          startedDate.toISOString()
        );
      });
    });

    describe("given item with no startedAt date", () => {
      it("should show 'Not started' message", () => {
        const item = createMockLibraryItem({ startedAt: null });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText("Not started")).toBeVisible();
      });
    });

    describe("given item with completedAt date", () => {
      it("should show formatted completed date", () => {
        const completedDate = new Date("2025-01-25T12:00:00Z");
        const item = createMockLibraryItem({ completedAt: completedDate });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const completedSection = elements.getCompletedDate();
        expect(completedSection).toBeVisible();
        expect(completedSection).toHaveTextContent("Jan 25, 2025");
      });

      it("should include time element with dateTime attribute", () => {
        const completedDate = new Date("2025-01-25T12:00:00Z");
        const item = createMockLibraryItem({ completedAt: completedDate });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const timeElements = screen.getAllByRole("time");
        const completedTimeElement = timeElements.find(
          (el) => el.getAttribute("dateTime") === completedDate.toISOString()
        );
        expect(completedTimeElement).toBeDefined();
        expect(completedTimeElement?.tagName).toBe("TIME");
        expect(completedTimeElement).toHaveTextContent("Jan 25, 2025");
      });
    });

    describe("given item with no completedAt date", () => {
      it("should show 'Not yet' message", () => {
        const item = createMockLibraryItem({ completedAt: null });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText("Not yet")).toBeVisible();
      });
    });

    describe("given item with createdAt and updatedAt dates", () => {
      it("should display created timestamp", () => {
        const item = createMockLibraryItem({
          createdAt: new Date("2025-01-10T12:00:00Z"),
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText(/added:/i)).toBeVisible();
        expect(screen.getByText("Jan 10, 2025")).toBeVisible();
      });

      it("should display updated timestamp", () => {
        const item = createMockLibraryItem({
          updatedAt: new Date("2025-01-20T12:00:00Z"),
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText(/updated:/i)).toBeVisible();
        expect(screen.getByText("Jan 20, 2025")).toBeVisible();
      });

      it("should include time elements with dateTime attributes", () => {
        const createdDate = new Date("2025-01-10T12:00:00Z");
        const updatedDate = new Date("2025-01-20T12:00:00Z");
        const item = createMockLibraryItem({
          createdAt: createdDate,
          updatedAt: updatedDate,
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const timeElements = screen.getAllByRole("time");

        const createdTime = timeElements.find(
          (el) => el.getAttribute("dateTime") === createdDate.toISOString()
        );
        expect(createdTime).toBeDefined();
        expect(createdTime).toHaveTextContent("Jan 10, 2025");

        const updatedTime = timeElements.find(
          (el) => el.getAttribute("dateTime") === updatedDate.toISOString()
        );
        expect(updatedTime).toBeDefined();
        expect(updatedTime).toHaveTextContent("Jan 20, 2025");
      });
    });

    describe("given formatAbsoluteDate utility", () => {
      it("should call formatAbsoluteDate for all displayed dates", () => {
        const mockFormatAbsoluteDate = vi.mocked(formatAbsoluteDate);
        const item = createMockLibraryItem({
          startedAt: new Date("2025-01-15T12:00:00Z"),
          completedAt: new Date("2025-01-25T12:00:00Z"),
          createdAt: new Date("2025-01-10T12:00:00Z"),
          updatedAt: new Date("2025-01-20T12:00:00Z"),
        });

        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(mockFormatAbsoluteDate).toHaveBeenCalledTimes(4);
      });

      it("should not call formatAbsoluteDate for null dates", () => {
        const mockFormatAbsoluteDate = vi.mocked(formatAbsoluteDate);
        mockFormatAbsoluteDate.mockClear();

        const item = createMockLibraryItem({
          startedAt: null,
          completedAt: null,
        });

        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(mockFormatAbsoluteDate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Interaction Tests", () => {
    describe("given card with onClick handler", () => {
      it("should call onClick when card is clicked", async () => {
        const handleClick = vi.fn();
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={handleClick} />);

        await userEvent.click(elements.getCard());

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("should call onClick when Enter key is pressed", async () => {
        const handleClick = vi.fn();
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={handleClick} />);

        const card = elements.getCard();
        card.focus();
        await userEvent.keyboard("{Enter}");

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("should call onClick when Space key is pressed", async () => {
        const handleClick = vi.fn();
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={handleClick} />);

        const card = elements.getCard();
        card.focus();
        await userEvent.keyboard(" ");

        expect(handleClick).toHaveBeenCalledTimes(1);
      });

      it("should not call onClick for other keys", async () => {
        const handleClick = vi.fn();
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={handleClick} />);

        const card = elements.getCard();
        card.focus();
        await userEvent.keyboard("{Escape}");
        await userEvent.keyboard("a");

        expect(handleClick).not.toHaveBeenCalled();
      });

      it("should have cursor-pointer styling", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const card = elements.getCard();
        expect(card).toHaveClass("cursor-pointer");
      });

      it("should have hover shadow effect", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const card = elements.getCard();
        expect(card).toHaveClass("hover:shadow-md");
      });
    });

    describe("given card without onClick handler", () => {
      it("should not render as button role", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} />);

        expect(elements.queryCard()).not.toBeInTheDocument();
      });

      it("should not have cursor-pointer styling", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} />);

        const card = screen.queryByRole("button");
        expect(card).not.toBeInTheDocument();
      });

      it("should not have tabIndex", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} />);

        const card = screen.queryByRole("button");
        expect(card).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Tests", () => {
    describe("given card with onClick handler", () => {
      it("should have role='button'", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getCard()).toHaveAttribute("role", "button");
      });

      it("should have tabIndex=0 for keyboard navigation", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(elements.getCard()).toHaveAttribute("tabIndex", "0");
      });

      it("should be focusable", () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const card = elements.getCard();
        card.focus();
        expect(card).toHaveFocus();
      });
    });

    describe("given semantic HTML for dates", () => {
      it("should use time elements for all dates", () => {
        const item = createMockLibraryItem({
          startedAt: new Date("2025-01-15T12:00:00Z"),
          completedAt: new Date("2025-01-25T12:00:00Z"),
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const timeElements = screen.getAllByRole("time");
        expect(timeElements).toHaveLength(4);
      });

      it("should include dateTime attributes for machine readability", () => {
        const startedDate = new Date("2025-01-15T12:00:00Z");
        const item = createMockLibraryItem({ startedAt: startedDate });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        const timeElement = screen.getByText("Jan 15, 2025");
        expect(timeElement).toHaveAttribute(
          "dateTime",
          startedDate.toISOString()
        );
      });
    });

    describe("given platform label", () => {
      it("should have aria-label for platform", () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByLabelText("Platform")).toBeVisible();
      });
    });

    describe("given icons", () => {
      it("should have aria-hidden on decorative icons", () => {
        const item = createMockLibraryItem({
          startedAt: new Date("2025-01-15T12:00:00Z"),
        });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(screen.getByText(/started:/i)).toBeVisible();
        expect(screen.getByLabelText("Platform")).toBeVisible();
      });
    });
  });

  describe("Status Badge Variants", () => {
    it("should display badge for CURRENTLY_EXPLORING", () => {
      const item = createMockLibraryItem({
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });
      render(<LibraryItemCard item={item} onClick={vi.fn()} />);

      const badge = screen.getByText("Currently Exploring");
      expect(badge).toBeVisible();
    });

    it("should display badge for EXPERIENCED", () => {
      const item = createMockLibraryItem({
        status: LibraryItemStatus.EXPERIENCED,
      });
      render(<LibraryItemCard item={item} onClick={vi.fn()} />);

      const badge = screen.getByText("Experienced");
      expect(badge).toBeVisible();
    });

    it("should display badge for TOOK_A_BREAK", () => {
      const item = createMockLibraryItem({
        status: LibraryItemStatus.TOOK_A_BREAK,
      });
      render(<LibraryItemCard item={item} onClick={vi.fn()} />);

      const badge = screen.getByText("Taking a Break");
      expect(badge).toBeVisible();
    });

    it("should display badge for WISHLIST", () => {
      const item = createMockLibraryItem({
        status: LibraryItemStatus.WISHLIST,
      });
      render(<LibraryItemCard item={item} onClick={vi.fn()} />);

      const badge = screen.getByText("Wishlist");
      expect(badge).toBeVisible();
    });
  });

  describe("Delete Functionality Tests", () => {
    describe("given card with onDelete handler", () => {
      it("should render delete button", () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        expect(deleteButton).toBeVisible();
      });

      it("should render delete button with trash icon", () => {
        const item = createMockLibraryItem();
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete.*entry/i,
        });
        expect(deleteButton).toBeVisible();

        expect(deleteButton).toHaveAccessibleName(/delete.*entry/i);
      });

      it("should open confirmation dialog when delete button is clicked", async () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        expect(
          screen.getByRole("heading", { name: /delete library entry/i })
        ).toBeVisible();
        expect(screen.getByText(/are you sure/i)).toBeVisible();
      });

      it("should not trigger card onClick when delete button is clicked", async () => {
        const handleCardClick = vi.fn();
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard
            item={item}
            onClick={handleCardClick}
            onDelete={vi.fn()}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        expect(handleCardClick).not.toHaveBeenCalled();
      });

      it("should call onDelete when deletion is confirmed", async () => {
        const handleDelete = vi.fn();
        const item = createMockLibraryItem({
          id: 42,
          platform: "PlayStation 5",
        });
        render(
          <LibraryItemCard
            item={item}
            onClick={vi.fn()}
            onDelete={handleDelete}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(confirmButton);

        expect(handleDelete).toHaveBeenCalledWith(42);
        expect(handleDelete).toHaveBeenCalledTimes(1);
      });

      it("should NOT call onDelete when deletion is cancelled", async () => {
        const handleDelete = vi.fn();
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard
            item={item}
            onClick={vi.fn()}
            onDelete={handleDelete}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        await userEvent.click(cancelButton);

        expect(handleDelete).not.toHaveBeenCalled();
      });

      it("should close confirmation dialog after confirming deletion", async () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(confirmButton);

        expect(
          screen.queryByRole("heading", { name: /delete library entry/i })
        ).not.toBeInTheDocument();
      });

      it("should close confirmation dialog after cancelling deletion", async () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        await userEvent.click(cancelButton);

        expect(
          screen.queryByRole("heading", { name: /delete library entry/i })
        ).not.toBeInTheDocument();
      });

      it("should use platform name in delete button aria-label", () => {
        const item = createMockLibraryItem({ platform: "Nintendo Switch" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        expect(
          screen.getByRole("button", { name: /delete nintendo switch entry/i })
        ).toBeVisible();
      });

      it("should use 'library' in aria-label when platform is not set", () => {
        const item = createMockLibraryItem({ platform: null });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        expect(
          screen.getByRole("button", { name: /delete library entry/i })
        ).toBeVisible();
      });

      it("should pass correct item description to confirmation dialog", async () => {
        const item = createMockLibraryItem({ platform: "PC" });
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete pc entry/i,
        });
        await userEvent.click(deleteButton);

        expect(screen.getByText("PC")).toBeVisible();
        expect(
          screen.getByText(/are you sure you want to delete your/i)
        ).toBeVisible();
      });

      it("should handle multiple delete attempts (reopening dialog)", async () => {
        const handleDelete = vi.fn();
        const item = createMockLibraryItem({
          id: 42,
          platform: "PlayStation 5",
        });
        render(
          <LibraryItemCard
            item={item}
            onClick={vi.fn()}
            onDelete={handleDelete}
          />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete playstation 5 entry/i,
        });
        await userEvent.click(deleteButton);

        const cancelButton = screen.getByRole("button", {
          name: /cancel deletion/i,
        });
        await userEvent.click(cancelButton);

        expect(handleDelete).not.toHaveBeenCalled();

        await userEvent.click(deleteButton);

        const confirmButton = screen.getByRole("button", {
          name: /confirm deletion/i,
        });
        await userEvent.click(confirmButton);

        expect(handleDelete).toHaveBeenCalledWith(42);
        expect(handleDelete).toHaveBeenCalledTimes(1);
      });
    });

    describe("given card without onDelete handler", () => {
      it("should not render delete button", () => {
        const item = createMockLibraryItem({ platform: "PlayStation 5" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(
          screen.queryByRole("button", { name: /delete.*entry/i })
        ).not.toBeInTheDocument();
      });

      it("should not render delete button even with platform set", () => {
        const item = createMockLibraryItem({ platform: "PC" });
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(
          screen.queryByRole("button", { name: /delete/i })
        ).not.toBeInTheDocument();
      });

      it("should not show confirmation dialog", async () => {
        const item = createMockLibraryItem();
        render(<LibraryItemCard item={item} onClick={vi.fn()} />);

        expect(
          screen.queryByRole("heading", { name: /delete library entry/i })
        ).not.toBeInTheDocument();
      });
    });

    describe("Delete button styling", () => {
      it("should have destructive styling classes", () => {
        const item = createMockLibraryItem();
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete.*entry/i,
        });

        expect(deleteButton).toHaveClass("text-destructive");
        expect(deleteButton).toHaveClass("hover:bg-destructive/10");
        expect(deleteButton).toHaveClass("hover:text-destructive");
      });

      it("should be a ghost variant button", () => {
        const item = createMockLibraryItem();
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton = screen.getByRole("button", {
          name: /delete.*entry/i,
        });

        expect(deleteButton).toBeVisible();
      });
    });

    describe("Dialog state management", () => {
      it("should initialize with dialog closed", () => {
        const item = createMockLibraryItem();
        render(
          <LibraryItemCard item={item} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        expect(
          screen.queryByRole("heading", { name: /delete library entry/i })
        ).not.toBeInTheDocument();
      });

      it("should maintain dialog state independently per card", async () => {
        const item1 = createMockLibraryItem({ id: 1, platform: "PS5" });
        const item2 = createMockLibraryItem({ id: 2, platform: "PC" });

        const { rerender } = render(
          <LibraryItemCard item={item1} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        const deleteButton1 = screen.getByRole("button", {
          name: /delete ps5 entry/i,
        });
        await userEvent.click(deleteButton1);

        expect(
          screen.getByRole("heading", { name: /delete library entry/i })
        ).toBeVisible();

        rerender(
          <LibraryItemCard item={item2} onClick={vi.fn()} onDelete={vi.fn()} />
        );

        expect(screen.queryByText("PS5")).not.toBeInTheDocument();
      });
    });
  });
});
