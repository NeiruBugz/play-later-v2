/**
 * Component tests for GlobalActionHost.
 *
 * CONTRACT
 * - action="add-game"   → Add content renders (inside the appropriate shell).
 * - action="log-session" → the one Log form renders; `game` pre-chooses the game.
 * - no action           → nothing renders.
 * - closing the flow    → navigate is called clearing `action` and `game`.
 *
 * NOT tested: Log form internals (tested in compose-journal-entry).
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
  useRouter: () => ({ invalidate: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Media-query mock — flipped per describe block
// ---------------------------------------------------------------------------

let mockIsDesktop = true;

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mockIsDesktop,
}));

vi.mock("@/features/compose-journal-entry", () => ({
  LogForm: ({ gameSlug }: { gameSlug?: string }) => (
    <div data-testid="log-form">log-form game={gameSlug ?? "none"}</div>
  ),
  LogFollowUpsProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));

vi.mock("@/features/add-game/ui/add-game-content", () => ({
  AddGameContent: () => (
    <div data-testid="add-game-content">add-game-content</div>
  ),
}));

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryLogForm: () => screen.queryByTestId("log-form"),
  findLogForm: () => screen.findByTestId("log-form"),
  queryAddGameContent: () => screen.queryByTestId("add-game-content"),
  findAddGameContent: () => screen.findByTestId("add-game-content"),
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
      render(<GlobalActionHost />);
    });

    it("renders the Log form with no game chosen", async () => {
      expect((await elements.findLogForm()).textContent).toContain("game=none");
    });

    it("titles the dialog Log time", () => {
      expect(screen.getByRole("heading", { name: "Log time" })).toBeDefined();
    });
  });

  describe('given action="log-session" with a game slug', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "log-session", game: "hollow-knight" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders the same Log form with the game chosen", async () => {
      expect((await elements.findLogForm()).textContent).toContain(
        "game=hollow-knight"
      );
    });
  });

  describe('given action="add-game"', () => {
    beforeEach(() => {
      mockIsDesktop = true;
      mockSearch = { action: "add-game" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
    });

    it("renders the Add Game content", async () => {
      expect(await elements.findAddGameContent()).toBeDefined();
    });

    it("does not render the Log form", async () => {
      await elements.findAddGameContent();
      expect(elements.queryLogForm()).toBeNull();
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
      expect(elements.queryLogForm()).toBeNull();
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
      mockSearch = { action: "log-session", game: "some-slug" };
      mockNavigate.mockReset();
      render(<GlobalActionHost />);
      await elements.findLogForm();
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
      // closeGlobalAction sets action/game to undefined so TanStack Router
      // drops them from the URL; the raw search object carries undefined values.
      expect(result.action).toBeUndefined();
      expect(result.game).toBeUndefined();
      expect(result).toHaveProperty("other", "keep");
    });
  });
});
