import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpNextQueueList } from "./up-next-queue-list";

const mockMoveInUpNextFn = vi.fn();
vi.mock("../../api/move-in-up-next-fn", () => ({
  moveInUpNextFn: (...args: unknown[]) => mockMoveInUpNextFn(...args),
}));

const mockInvalidate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockInvalidate }),
}));

const mockToastError = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

const queue = [
  { id: 11, game: { title: "Hades" } },
  { id: 12, game: { title: "Celeste" } },
  { id: 13, game: { title: "Tunic" } },
];

const elements = {
  getRows: () =>
    within(screen.getByRole("list", { name: "Up Next queue" })).getAllByRole(
      "listitem"
    ),
  getTitles: () =>
    elements
      .getRows()
      .map((row) => within(row).getByTestId("body").textContent),
  getMoveUp: (title: string) =>
    screen.getByRole("button", { name: `Move ${title} up` }),
  queryMoveUp: (title: string) =>
    screen.queryByRole("button", { name: `Move ${title} up` }),
  getMoveDown: (title: string) =>
    screen.getByRole("button", { name: `Move ${title} down` }),
  queryMoveDown: (title: string) =>
    screen.queryByRole("button", { name: `Move ${title} down` }),
  getAnnouncement: () => screen.getByRole("status"),
};

const actions = {
  moveDown: (title: string) => userEvent.click(elements.getMoveDown(title)),
};

function renderQueue() {
  return render(
    <UpNextQueueList
      items={queue}
      renderItem={(item) => <span data-testid="body">{item.game.title}</span>}
    />
  );
}

describe("UpNextQueueList", () => {
  beforeEach(() => {
    mockMoveInUpNextFn.mockReset();
    mockInvalidate.mockReset();
    mockToastError.mockReset();
  });

  describe("given a queue of three games", () => {
    beforeEach(() => {
      renderQueue();
    });

    it("lists the games in queue order, numbered 1 to 3", () => {
      expect(elements.getTitles()).toEqual(["Hades", "Celeste", "Tunic"]);
      expect(
        elements.getRows().map((row) => row.textContent?.charAt(0))
      ).toEqual(["1", "2", "3"]);
    });

    it("hides Move up on the first game", () => {
      expect(elements.queryMoveUp("Hades")).toBeNull();
      expect(elements.getMoveDown("Hades")).toBeDefined();
    });

    it("hides Move down on the last game", () => {
      expect(elements.queryMoveDown("Tunic")).toBeNull();
      expect(elements.getMoveUp("Tunic")).toBeDefined();
    });
  });

  describe("when the user moves the first game down", () => {
    beforeEach(async () => {
      mockMoveInUpNextFn.mockResolvedValue([
        { id: 12, position: 1 },
        { id: 11, position: 2 },
        { id: 13, position: 3 },
      ]);
      renderQueue();
      await actions.moveDown("Hades");
    });

    it("asks the server to move that game down", () => {
      expect(mockMoveInUpNextFn).toHaveBeenCalledWith({
        data: { id: 11, direction: "down" },
      });
    });

    it("shows the order the server returned", () => {
      expect(elements.getTitles()).toEqual(["Celeste", "Hades", "Tunic"]);
    });

    it("announces the new position", () => {
      expect(elements.getAnnouncement().textContent).toBe("Hades is now #2");
    });

    it("refreshes the page data after the save", () => {
      expect(mockInvalidate).toHaveBeenCalledTimes(1);
    });
  });

  describe("while a move is in flight", () => {
    it("disables the move buttons", async () => {
      mockMoveInUpNextFn.mockReturnValue(new Promise(() => undefined));
      renderQueue();
      await actions.moveDown("Hades");

      expect(
        (elements.getMoveDown("Celeste") as HTMLButtonElement).disabled
      ).toBe(true);
    });
  });

  describe("when saving the move fails", () => {
    beforeEach(async () => {
      mockMoveInUpNextFn.mockRejectedValue(new Error("offline"));
      renderQueue();
      await actions.moveDown("Hades");
    });

    it("puts the games back in their original order", async () => {
      await waitFor(() =>
        expect(elements.getTitles()).toEqual(["Hades", "Celeste", "Tunic"])
      );
    });

    it("tells the user it could not be saved", () => {
      expect(mockToastError).toHaveBeenCalledWith("Couldn't save. Try again.");
    });

    it("does not refresh the page data", () => {
      expect(mockInvalidate).not.toHaveBeenCalled();
    });
  });
});
