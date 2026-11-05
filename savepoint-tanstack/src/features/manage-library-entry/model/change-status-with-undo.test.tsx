import { beforeEach, describe, expect, it, vi } from "vitest";

import { changeStatusWithUndo } from "./change-status-with-undo";

const { setStatusFnMock, undoStatusFnMock, toastMock, showUndoToastMock } =
  vi.hoisted(() => ({
    setStatusFnMock: vi.fn(),
    undoStatusFnMock: vi.fn(),
    toastMock: Object.assign(vi.fn(), { error: vi.fn() }),
    showUndoToastMock: vi.fn(),
  }));

vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("@/shared/ui/undo-toast", () => ({ showUndoToast: showUndoToastMock }));
vi.mock("../api/set-status-fn", () => ({ setStatusFn: setStatusFnMock }));
vi.mock("../api/undo-status-fn", () => ({ undoStatusFn: undoStatusFnMock }));
vi.mock("@/shared/lib/user-facing-error", () => ({
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

const UNDO_PAYLOAD = { snapshot: {}, createdPlayId: null, closedPlayId: null };
const PREVIOUS = { status: "WANT" as const, upNextPosition: 2 };

const run = () => {
  const onDisplay = vi.fn();
  const invalidate = vi.fn();
  const runUndo = async (task: () => Promise<boolean>) => {
    if (await task()) invalidate();
  };
  const changed = changeStatusWithUndo({
    id: 7,
    gameTitle: "Hades",
    to: "PLAYING",
    previous: PREVIOUS,
    onDisplay,
    runUndo,
  });
  return { changed, onDisplay, invalidate };
};

const pressUndo = async () => {
  const { onUndo } = showUndoToastMock.mock.calls[0][0];
  onUndo();
  await vi.waitFor(() => expect(undoStatusFnMock).toHaveBeenCalled());
};

describe("changeStatusWithUndo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given the save succeeds", () => {
    beforeEach(() => {
      setStatusFnMock.mockResolvedValue({
        status: "PLAYING",
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      });
    });

    it("displays the new status and announces it with an Undo toast", async () => {
      const { changed, onDisplay } = run();
      expect(await changed).toBe(true);
      expect(setStatusFnMock).toHaveBeenCalledWith({
        data: { id: 7, to: "PLAYING" },
      });
      expect(onDisplay).toHaveBeenCalledWith({
        status: "PLAYING",
        upNextPosition: null,
      });
      expect(showUndoToastMock.mock.calls[0][0].message).toBe(
        "Hades is now Playing"
      );
    });

    it("restores the previous status and refreshes when Undo is pressed", async () => {
      undoStatusFnMock.mockResolvedValue({
        status: "WANT",
        upNextPosition: 2,
        queueRestored: true,
      });
      const { changed, onDisplay, invalidate } = run();
      await changed;
      await pressUndo();
      await vi.waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
      expect(undoStatusFnMock).toHaveBeenCalledWith({
        data: { id: 7, undo: UNDO_PAYLOAD },
      });
      expect(onDisplay).toHaveBeenLastCalledWith(PREVIOUS);
      expect(toastMock).not.toHaveBeenCalled();
    });

    it("explains when Undo could not put the game back in the queue", async () => {
      undoStatusFnMock.mockResolvedValue({
        status: "WANT",
        upNextPosition: null,
        queueRestored: false,
      });
      const { changed } = run();
      await changed;
      await pressUndo();
      await vi.waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith(
          "Up Next is full, so Hades wasn't put back in the queue."
        )
      );
    });

    it("keeps the saved status and skips the refresh when Undo fails", async () => {
      undoStatusFnMock.mockRejectedValue(new Error("P2025 raw"));
      const { changed, onDisplay, invalidate } = run();
      await changed;
      await pressUndo();
      await vi.waitFor(() =>
        expect(toastMock.error).toHaveBeenCalledWith(
          "Couldn't save. Try again."
        )
      );
      expect(onDisplay).toHaveBeenLastCalledWith({
        status: "PLAYING",
        upNextPosition: null,
      });
      expect(invalidate).not.toHaveBeenCalled();
    });
  });

  describe("given the save fails", () => {
    it("rolls back, shows the mapped copy and does not refresh", async () => {
      setStatusFnMock.mockRejectedValue(new Error("Invalid `prisma` call"));
      const { changed, onDisplay, invalidate } = run();
      expect(await changed).toBe(false);
      expect(onDisplay).toHaveBeenCalledWith(PREVIOUS);
      expect(toastMock.error).toHaveBeenCalledWith("Couldn't save. Try again.");
      expect(showUndoToastMock).not.toHaveBeenCalled();
      expect(invalidate).not.toHaveBeenCalled();
    });
  });
});
