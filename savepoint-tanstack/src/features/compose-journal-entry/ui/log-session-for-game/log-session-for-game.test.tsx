/**
 * Component tests for LogSessionForGame (Spec 025 Slice 3b).
 *
 * CONTRACT
 * - given a game slug, calls the game-data server fn and renders a loading state while pending.
 * - once resolved, renders LogSessionContent with the numeric gameId and playthroughs from the fn result.
 * - when the game has no playthroughs, renders LogSessionContent without crashing.
 *
 * TODO (GREEN step): confirm the exact server fn module path and adjust the mock below.
 * Placeholder path: "@/features/compose-journal-entry/api/get-log-session-game-data"
 * The GREEN agent should verify this path matches the real createServerFn file it creates
 * and update the mock accordingly.
 *
 * NOT tested: LogSessionContent form internals (tested in log-session-content tests).
 */

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogSessionForGame } from "./log-session-for-game";

// ---------------------------------------------------------------------------
// Server fn mock
// Path: "@/features/compose-journal-entry/api/get-log-session-game-data"
// ---------------------------------------------------------------------------

const { mockGetLogSessionGameData } = vi.hoisted(() => ({
  mockGetLogSessionGameData: vi.fn(),
}));

vi.mock(
  "@/features/compose-journal-entry/api/get-log-session-game-data",
  () => ({
    getLogSessionGameDataFn: mockGetLogSessionGameData,
  })
);

// ---------------------------------------------------------------------------
// LogSessionContent stub — captures the props it receives
// ---------------------------------------------------------------------------

let capturedLogSessionContentProps: Record<string, unknown> = {};

vi.mock("@/features/compose-journal-entry/ui/log-session-content", () => ({
  LogSessionContent: (props: Record<string, unknown>) => {
    capturedLogSessionContentProps = props;
    return (
      <div data-testid="log-session-content-stub">
        log-session-content gameId={String(props.gameId)}
      </div>
    );
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PLAYTHROUGH = {
  id: "pt-1",
  kind: "FIRST" as const,
  status: "PLAYING" as const,
  platform: "PC",
  startedAt: null,
  finishedAt: null,
  rating: null,
  notes: null,
  journalEntries: [],
};

const MOCK_GAME_DATA = {
  gameId: "game-db-id-123",
  playthroughs: [MOCK_PLAYTHROUGH],
  preselectedPlaythroughId: "pt-1",
};

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryLoadingState: () => screen.queryByTestId("log-session-for-game-loading"),
  queryLogSessionContent: () =>
    screen.queryByTestId("log-session-content-stub"),
  getLogSessionContent: () => screen.getByTestId("log-session-content-stub"),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LogSessionForGame", () => {
  describe("given a game slug", () => {
    beforeEach(() => {
      capturedLogSessionContentProps = {};
      mockGetLogSessionGameData.mockReset();
    });

    describe("while the game data is loading", () => {
      beforeEach(() => {
        // Never resolve — keeps the component in loading state
        mockGetLogSessionGameData.mockReturnValue(new Promise(() => {}));
        render(<LogSessionForGame game="hollow-knight" onClose={vi.fn()} />);
      });

      it("shows a loading state", () => {
        expect(elements.queryLoadingState()).toBeDefined();
      });

      it("does not render LogSessionContent yet", () => {
        expect(elements.queryLogSessionContent()).toBeNull();
      });
    });

    describe("once game data resolves with playthroughs", () => {
      beforeEach(async () => {
        mockGetLogSessionGameData.mockResolvedValue(MOCK_GAME_DATA);
        render(<LogSessionForGame game="hollow-knight" onClose={vi.fn()} />);
        await waitFor(() => {
          expect(elements.queryLogSessionContent()).not.toBeNull();
        });
      });

      it("renders LogSessionContent", () => {
        expect(elements.getLogSessionContent()).toBeDefined();
      });

      it("passes the numeric gameId to LogSessionContent", () => {
        expect(elements.getLogSessionContent().textContent).toContain(
          "gameId=game-db-id-123"
        );
      });

      it("passes the playthroughs to LogSessionContent", () => {
        expect(capturedLogSessionContentProps.playthroughs).toEqual(
          MOCK_GAME_DATA.playthroughs
        );
      });
    });

    describe("once game data resolves with no playthroughs", () => {
      beforeEach(async () => {
        mockGetLogSessionGameData.mockResolvedValue({
          gameId: "game-db-id-456",
          playthroughs: [],
          preselectedPlaythroughId: "",
        });
        render(<LogSessionForGame game="celeste" onClose={vi.fn()} />);
        await waitFor(() => {
          expect(elements.queryLogSessionContent()).not.toBeNull();
        });
      });

      it("renders LogSessionContent without crashing", () => {
        expect(elements.getLogSessionContent()).toBeDefined();
      });

      it("passes an empty playthroughs array", () => {
        expect(capturedLogSessionContentProps.playthroughs).toEqual([]);
      });
    });
  });
});
