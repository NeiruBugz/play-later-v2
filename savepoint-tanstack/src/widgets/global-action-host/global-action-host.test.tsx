/**
 * Component tests for GlobalActionHost (Spec 025 Slice 2 + Slice 3b).
 *
 * CONTRACT (Slice 2 — unchanged)
 * - action="add-game"   → Add content renders (inside the appropriate shell).
 * - no action           → nothing renders.
 * - closing the flow    → navigate is called clearing `action` and `game`.
 *
 * CONTRACT (Slice 3b — new delegation)
 * - action="log-session" + no game  → host delegates to LogSessionGamePicker (NOT LogSessionContent directly)
 * - action="log-session" + game     → host delegates to LogSessionForGame with the slug prop
 * - picker fires onSelect(slug)     → navigate is called with a search updater that sets game=slug keeping action
 *
 * NOT tested: form internals of either content component (tested in their own slices).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalActionHost } from "./index";

// ---------------------------------------------------------------------------
// Router mocks — controllable per describe block
// ---------------------------------------------------------------------------

let mockSearch: { action?: "log-session" | "add-game"; game?: string } = {};
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => mockSearch,
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Media-query mock — flipped per describe block
// ---------------------------------------------------------------------------

let mockIsDesktop = true;

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

// ---------------------------------------------------------------------------
// Feature stubs — Slice 3b replaces LogSessionContent direct render with
// LogSessionGamePicker + LogSessionForGame delegation.
// The host no longer renders LogSessionContent directly for log-session.
// ---------------------------------------------------------------------------

let pickerOnSelect: ((slug: string) => void) | undefined;

vi.mock("@/features/compose-journal-entry", () => ({
  LogSessionGamePicker: ({
    onSelect,
  }: {
    onSelect: (slug: string) => void;
  }) => {
    pickerOnSelect = onSelect;
    return (
      <div data-testid="log-session-game-picker">log-session-game-picker</div>
    );
  },
  LogSessionForGame: ({ game }: { game: string }) => (
    <div data-testid="log-session-for-game">
      log-session-for-game game={game}
    </div>
  ),
}));

vi.mock("@/features/add-game", () => ({
  AddGameContent: () => (
    <div data-testid="add-game-content">add-game-content</div>
  ),
}));

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryLogSessionGamePicker: () =>
    screen.queryByTestId("log-session-game-picker"),
  getLogSessionGamePicker: () => screen.getByTestId("log-session-game-picker"),
  queryLogSessionForGame: () => screen.queryByTestId("log-session-for-game"),
  getLogSessionForGame: () => screen.getByTestId("log-session-for-game"),
  queryAddGameContent: () => screen.queryByTestId("add-game-content"),
  getAddGameContent: () => screen.getByTestId("add-game-content"),
  // Dialog shell: Radix Dialog.Content sets role="dialog"
  queryDialog: () => screen.queryByRole("dialog"),
  getDialog: () => screen.getByRole("dialog"),
  // Sheet is built on Radix Dialog too but the host renders side="bottom";
  // distinguished via data-testid added by the host.
  querySheet: () => screen.queryByTestId("global-action-sheet"),
  getSheet: () => screen.getByTestId("global-action-sheet"),
  queryDialogWrapper: () => screen.queryByTestId("global-action-dialog"),
  getDialogWrapper: () => screen.getByTestId("global-action-dialog"),
  // Close button: shadcn Dialog/Sheet both include an sr-only "Close" span
  getCloseButton: () => screen.getByRole("button", { name: "Close" }),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  clickClose: async () => {
    await userEvent.click(elements.getCloseButton());
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GlobalActionHost", () => {
  describe('given action="log-session" and no game param', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session" };
      mockNavigate.mockReset();
      pickerOnSelect = undefined;
      render(<GlobalActionHost />);
    });

    it("renders LogSessionGamePicker", () => {
      expect(elements.getLogSessionGamePicker()).toBeDefined();
    });

    it("does not render LogSessionForGame", () => {
      expect(elements.queryLogSessionForGame()).toBeNull();
    });
  });

  describe('given action="log-session" with a game slug', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session", game: "hollow-knight" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders LogSessionForGame with the game slug", () => {
      expect(elements.getLogSessionForGame().textContent).toContain(
        "game=hollow-knight"
      );
    });

    it("does not render LogSessionGamePicker", () => {
      expect(elements.queryLogSessionGamePicker()).toBeNull();
    });
  });

  describe("when the picker fires onSelect", () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session" };
      mockNavigate.mockReset();
      pickerOnSelect = undefined;
      render(<GlobalActionHost />);
    });

    it("calls navigate with a search updater that sets game and keeps action", () => {
      // pickerOnSelect is captured by the stub during render
      expect(pickerOnSelect).toBeDefined();
      pickerOnSelect!("celeste");

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.any(Function),
        })
      );

      const call = mockNavigate.mock.calls[0][0] as {
        search: (prev: Record<string, unknown>) => Record<string, unknown>;
      };
      const result = call.search({ action: "log-session", other: "keep" });
      expect(result).toHaveProperty("action", "log-session");
      expect(result).toHaveProperty("game", "celeste");
      expect(result).toHaveProperty("other", "keep");
    });
  });

  describe('given action="add-game"', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "add-game" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders the Add Game content", () => {
      expect(elements.getAddGameContent()).toBeDefined();
    });

    it("does not render the log-session picker or game view", () => {
      expect(elements.queryLogSessionGamePicker()).toBeNull();
      expect(elements.queryLogSessionForGame()).toBeNull();
    });
  });

  describe("given no action param", () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = {};
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders neither flow", () => {
      expect(elements.queryLogSessionGamePicker()).toBeNull();
      expect(elements.queryLogSessionForGame()).toBeNull();
      expect(elements.queryAddGameContent()).toBeNull();
    });

    it("renders no dialog or sheet shell", () => {
      expect(elements.queryDialog()).toBeNull();
      expect(elements.querySheet()).toBeNull();
    });
  });

  describe("when the user closes the flow", () => {
    beforeEach(async () => {
      mockIsDesktop = true;
      // use game slug so we get LogSessionForGame (which has a Close button via the shell)
      mockSearch = { action: "log-session", game: "some-slug" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
      await actions.clickClose();
    });

    it("calls navigate to clear action and game search params", () => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.any(Function),
        })
      );
      const call = mockNavigate.mock.calls[0][0] as {
        search: (prev: Record<string, unknown>) => Record<string, unknown>;
      };
      const result = call.search({
        action: "log-session",
        game: "slug",
        other: "keep",
      });
      expect(result).not.toHaveProperty("action");
      expect(result).not.toHaveProperty("game");
      expect(result).toHaveProperty("other", "keep");
    });
  });
});
