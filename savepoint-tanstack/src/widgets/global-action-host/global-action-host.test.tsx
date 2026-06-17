/**
 * Component tests for GlobalActionHost (Spec 025 Slice 2).
 *
 * CONTRACT
 * - action="log-session" on desktop → Log content renders inside a Dialog shell.
 * - action="log-session" on mobile  → Log content renders inside a bottom Sheet shell.
 * - action="add-game"               → Add content renders (inside the appropriate shell).
 * - no action                       → nothing renders.
 * - closing the flow                → navigate is called clearing `action` and `game`.
 * - action="log-session" + game slug → Log content receives the game slug.
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
// Content-component stubs
// ---------------------------------------------------------------------------

vi.mock("@/features/compose-journal-entry", () => ({
  LogSessionContent: ({ game }: { game?: string }) => (
    <div data-testid="log-session-content">
      log-session-content{game ? ` game=${game}` : ""}
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
  queryLogSessionContent: () => screen.queryByTestId("log-session-content"),
  getLogSessionContent: () => screen.getByTestId("log-session-content"),
  queryAddGameContent: () => screen.queryByTestId("add-game-content"),
  getAddGameContent: () => screen.getByTestId("add-game-content"),
  // Dialog shell: Radix Dialog.Content sets role="dialog"
  queryDialog: () => screen.queryByRole("dialog"),
  getDialog: () => screen.getByRole("dialog"),
  // Sheet is built on Radix Dialog too but the host must render side="bottom";
  // the host test distinguishes sheet from dialog via data-testid added by the host.
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
  describe('given action="log-session" on desktop', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders the Log Session content", () => {
      expect(elements.getLogSessionContent()).toBeDefined();
    });

    it("renders the content inside a Dialog shell (not a Sheet)", () => {
      expect(elements.queryDialogWrapper()).toBeDefined();
      expect(elements.querySheet()).toBeNull();
    });
  });

  describe('given action="log-session" on mobile', () => {
    beforeEach(() => {
      mockIsDesktop = false;
      mockSearch = { action: "log-session" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders the Log Session content", () => {
      expect(elements.getLogSessionContent()).toBeDefined();
    });

    it("renders the content inside a Sheet shell (not a Dialog)", () => {
      expect(elements.querySheet()).toBeDefined();
      expect(elements.queryDialogWrapper()).toBeNull();
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

    it("does not render the Log Session content", () => {
      expect(elements.queryLogSessionContent()).toBeNull();
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
      expect(elements.queryLogSessionContent()).toBeNull();
      expect(elements.queryAddGameContent()).toBeNull();
    });

    it("renders no dialog or sheet shell", () => {
      expect(elements.queryDialog()).toBeNull();
      expect(elements.querySheet()).toBeNull();
    });
  });

  describe('given action="log-session" with a game slug', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session", game: "some-slug" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("passes the game slug to LogSessionContent", () => {
      expect(elements.getLogSessionContent().textContent).toContain(
        "game=some-slug"
      );
    });
  });

  describe("when the user closes the flow", () => {
    beforeEach(async () => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session" };
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
      // Verify the updater function removes action and game
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
