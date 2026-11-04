import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { ManageFromGameDetailButton } from "./manage-from-game-detail-button";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/get-platform-options", () => ({
  getPlatformOptionsFn: vi.fn(() =>
    Promise.resolve([{ label: "This game", platforms: ["PC"] }])
  ),
}));

vi.mock("@/features/manage-library-entry/api/search-platforms-fn", () => ({
  searchPlatformsFn: vi.fn(() => Promise.resolve([])),
}));

const buildEntry = (): LibraryItemWithGame =>
  buildLibraryItemWithGame(
    { id: 1, status: "PLAYING", platform: "PC" },
    { id: "game-1", title: "Hollow Knight", slug: "hollow-knight" }
  );

const elements = {
  getButton: () =>
    screen.getByRole("button", { name: "Manage Hollow Knight in library" }),
  queryDialog: () => screen.queryByRole("dialog"),
  queryDialogTitle: () =>
    screen.queryByRole("heading", { name: "Hollow Knight", level: 2 }),
};

const actions = {
  click: () => userEvent.click(elements.getButton()),
};

describe("ManageFromGameDetailButton", () => {
  describe("given the button has not been clicked", () => {
    beforeEach(() => {
      render(<ManageFromGameDetailButton entry={buildEntry()} />);
    });

    it("renders the manage button", () => {
      expect(elements.getButton()).toBeDefined();
    });

    it("does not render the modal", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the user clicks the button", () => {
    beforeEach(async () => {
      render(<ManageFromGameDetailButton entry={buildEntry()} />);
      await actions.click();
    });

    it("opens the library modal", () => {
      expect(elements.queryDialog()).not.toBeNull();
    });

    it("renders the entry's game title in the dialog", () => {
      expect(elements.queryDialogTitle()).not.toBeNull();
    });
  });
});
