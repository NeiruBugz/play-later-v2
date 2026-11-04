import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemStatus } from "../../../../shared/lib/prisma/client.ts";
import { useSetStatus } from "./use-set-status";

const { setStatusFnMock, undoStatusFnMock, invalidateMock } = vi.hoisted(
  () => ({
    setStatusFnMock: vi.fn(),
    undoStatusFnMock: vi.fn(),
    invalidateMock: vi.fn(),
  })
);

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));
vi.mock("../api/set-status-fn", () => ({ setStatusFn: setStatusFnMock }));
vi.mock("../api/undo-status-fn", () => ({ undoStatusFn: undoStatusFnMock }));
vi.mock("@/shared/lib/user-facing-error", () => ({
  SAVE_FAILED_MESSAGE: "Couldn't save. Try again.",
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

const UNDO_PAYLOAD = {
  snapshot: {},
  createdPlayId: null,
  closedPlayId: null,
};

function Harness({ status }: { status: LibraryItemStatus }) {
  const state = useSetStatus({
    id: 7,
    gameTitle: "Hades",
    status,
    upNextPosition: null,
  });
  return (
    <>
      <p>Current: {state.status}</p>
      <button type="button" onClick={() => void state.setStatus("PLAYING")}>
        Start
      </button>
      <button type="button" onClick={() => void state.setStatus("DONE")}>
        Finish
      </button>
      <Toaster />
    </>
  );
}

const elements = {
  getCurrent: (status: string) => screen.getByText(`Current: ${status}`),
  getStart: () => screen.getByRole("button", { name: "Start" }),
  getFinish: () => screen.getByRole("button", { name: "Finish" }),
  findToast: (text: string) => screen.findByText(text),
  getUndo: () => screen.findByRole("button", { name: "Undo" }),
};

const actions = {
  start: () => userEvent.click(elements.getStart()),
  finish: () => userEvent.click(elements.getFinish()),
  undo: async () => userEvent.click(await elements.getUndo()),
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useSetStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateMock.mockResolvedValue(undefined);
  });

  describe("given a Want item and a slow save", () => {
    let pending: ReturnType<typeof deferred<unknown>>;

    beforeEach(async () => {
      pending = deferred<unknown>();
      setStatusFnMock.mockReturnValue(pending.promise);
      render(<Harness status="WANT" />);
      await actions.start();
    });

    it("shows the new status before the server answers", () => {
      expect(elements.getCurrent("PLAYING")).toBeInTheDocument();
    });

    it("ignores another tap on the same game while saving", async () => {
      await actions.finish();
      expect(setStatusFnMock).toHaveBeenCalledTimes(1);
      pending.resolve({
        status: "PLAYING",
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      });
      await waitFor(() => expect(invalidateMock).toHaveBeenCalledTimes(1));
    });
  });

  describe("given the save succeeds", () => {
    beforeEach(async () => {
      setStatusFnMock.mockResolvedValue({
        status: "PLAYING",
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      });
      render(<Harness status="WANT" />);
      await actions.start();
    });

    it("announces the change with an Undo action and refreshes once", async () => {
      expect(await elements.findToast("Hades is now Playing")).toBeVisible();
      expect(await elements.getUndo()).toBeVisible();
      expect(setStatusFnMock).toHaveBeenCalledWith({
        data: { id: 7, to: "PLAYING" },
      });
      expect(invalidateMock).toHaveBeenCalledTimes(1);
    });

    describe("when Undo is pressed", () => {
      beforeEach(async () => {
        undoStatusFnMock.mockResolvedValue({
          status: "WANT",
          upNextPosition: 2,
          queueRestored: true,
        });
        await actions.undo();
      });

      it("restores the previous status and sends the undo payload", async () => {
        await waitFor(() =>
          expect(elements.getCurrent("WANT")).toBeInTheDocument()
        );
        expect(undoStatusFnMock).toHaveBeenCalledWith({
          data: { id: 7, undo: UNDO_PAYLOAD },
        });
      });
    });

    describe("when Undo is pressed but the queue is full", () => {
      beforeEach(async () => {
        undoStatusFnMock.mockResolvedValue({
          status: "WANT",
          upNextPosition: null,
          queueRestored: false,
        });
        await actions.undo();
      });

      it("explains that the game was not put back in Up Next", async () => {
        expect(
          await elements.findToast(
            "Up Next is full, so Hades wasn't put back in the queue."
          )
        ).toBeVisible();
      });
    });
  });

  describe("given the save fails with a technical error", () => {
    beforeEach(async () => {
      setStatusFnMock.mockRejectedValue(
        new Error("Invalid `prisma.libraryItem.update()` invocation")
      );
      render(<Harness status="WANT" />);
      await actions.start();
    });

    it("rolls back to the previous status", async () => {
      await waitFor(() =>
        expect(elements.getCurrent("WANT")).toBeInTheDocument()
      );
    });

    it("shows the friendly message and never the raw error", async () => {
      expect(
        await elements.findToast("Couldn't save. Try again.")
      ).toBeVisible();
      expect(screen.queryByText(/prisma/i)).not.toBeInTheDocument();
    });

    it("does not refetch the page data", async () => {
      await elements.findToast("Couldn't save. Try again.");
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });

  describe("given Undo fails", () => {
    beforeEach(async () => {
      setStatusFnMock.mockResolvedValue({
        status: "PLAYING",
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      });
      undoStatusFnMock.mockRejectedValue(new Error("P2025 raw"));
      render(<Harness status="WANT" />);
      await actions.start();
      await actions.undo();
    });

    it("keeps the saved status and shows the friendly message", async () => {
      expect(
        await elements.findToast("Couldn't save. Try again.")
      ).toBeVisible();
      expect(screen.queryByText(/P2025/)).not.toBeInTheDocument();
      expect(elements.getCurrent("PLAYING")).toBeInTheDocument();
    });

    it("does not refetch the page data for the failed undo", async () => {
      await elements.findToast("Couldn't save. Try again.");
      expect(invalidateMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("given Undo succeeds", () => {
    beforeEach(async () => {
      setStatusFnMock.mockResolvedValue({
        status: "PLAYING",
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      });
      undoStatusFnMock.mockResolvedValue({
        status: "WANT",
        upNextPosition: null,
        queueRestored: true,
      });
      render(<Harness status="WANT" />);
      await actions.start();
      await actions.undo();
    });

    it("refreshes once for the change and once for the undo", async () => {
      await waitFor(() => expect(invalidateMock).toHaveBeenCalledTimes(2));
    });
  });
});
