import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSetStatus } from "@/features/manage-library-entry/model/use-set-status";

import { DoneFlowProvider } from "./done-flow-provider";

const mocks = vi.hoisted(() => ({
  setStatusFn: vi.fn(),
  undoStatusFn: vi.fn(),
  saveDoneFollowUpFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: mocks.setStatusFn,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: mocks.undoStatusFn,
}));
vi.mock("@/features/done-follow-up/api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: mocks.saveDoneFollowUpFn,
}));
vi.mock("@/features/done-follow-up/api/set-done-outcome-fn", () => ({
  setDoneOutcomeFn: vi.fn(),
}));
vi.mock("@/shared/lib/use-media-query", () => ({ useIsDesktop: () => true }));
vi.mock("@/shared/lib/user-facing-error", () => ({
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

const UNDO_PAYLOAD = { snapshot: {}, createdPlayId: null, closedPlayId: null };

function Harness() {
  const { setStatus } = useSetStatus({
    id: 7,
    gameTitle: "Hades",
    status: "PLAYING",
    upNextPosition: null,
    rating: 7,
  });
  return (
    <>
      <button type="button" onClick={() => void setStatus("DONE")}>
        Finish
      </button>
      <button type="button" onClick={() => void setStatus("WANT")}>
        Shelve
      </button>
    </>
  );
}

function renderHarness() {
  return render(
    <DoneFlowProvider>
      <Harness />
      <Toaster />
    </DoneFlowProvider>
  );
}

describe("DoneFlowProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setStatusFn.mockImplementation(
      async ({ data }: { data: { to: string } }) => ({
        status: data.to,
        upNextPosition: null,
        undo: UNDO_PAYLOAD,
      })
    );
    mocks.undoStatusFn.mockResolvedValue({
      status: "PLAYING",
      upNextPosition: null,
      queueRestored: true,
    });
  });

  it("opens the follow-up instead of the undo toast when a game is marked Done", async () => {
    renderHarness();

    await userEvent.click(screen.getByRole("button", { name: "Finish" }));

    expect(
      await screen.findByLabelText("What stayed with you?")
    ).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Rating" })).toHaveAttribute(
      "aria-valuenow",
      "7"
    );
    expect(screen.queryByText("Hades is now Done")).not.toBeInTheDocument();
  });

  it("Undo in the follow-up restores the previous status and saves nothing", async () => {
    renderHarness();

    await userEvent.click(screen.getByRole("button", { name: "Finish" }));
    await userEvent.type(
      await screen.findByLabelText("What stayed with you?"),
      "Great"
    );
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));

    await waitFor(() =>
      expect(mocks.undoStatusFn).toHaveBeenCalledWith({
        data: { id: 7, undo: UNDO_PAYLOAD },
      })
    );
    expect(mocks.saveDoneFollowUpFn).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByLabelText("What stayed with you?")
      ).not.toBeInTheDocument()
    );
  });

  it("keeps the normal undo toast for other status changes", async () => {
    renderHarness();

    await userEvent.click(screen.getByRole("button", { name: "Shelve" }));

    expect(await screen.findByText("Hades is now Want")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("What stayed with you?")
    ).not.toBeInTheDocument();
  });
});
