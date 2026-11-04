import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLogFollowUps } from "@/features/compose-journal-entry/model";

import { LogFormHost } from "./log-form-host";

const mocks = vi.hoisted(() => ({
  setStatusFn: vi.fn(),
  undoStatusFn: vi.fn(),
  invalidate: vi.fn(),
}));

const CELESTE = {
  libraryItemId: 2,
  upNextPosition: 3,
  gameId: "game-2",
  slug: "celeste",
  title: "Celeste",
  coverImage: null,
  status: "WANT" as const,
};

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: mocks.setStatusFn,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: mocks.undoStatusFn,
}));
vi.mock("@/features/compose-journal-entry", async () => {
  const model = await vi.importActual<
    typeof import("@/features/compose-journal-entry/model")
  >("@/features/compose-journal-entry/model");
  return {
    LogFollowUpsProvider: model.LogFollowUpsProvider,
    LogForm: () => {
      const followUps = useLogFollowUps();
      return (
        <button
          type="button"
          onClick={() => void followUps?.markPlaying(CELESTE)}
        >
          Mark as Playing
        </button>
      );
    },
  };
});

describe("LogFormHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setStatusFn.mockResolvedValue({
      status: "PLAYING",
      upNextPosition: null,
      undo: {},
    });
  });

  it("marks the game Playing through manage-library-entry and confirms with Undo", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Toaster />
        <LogFormHost onClose={vi.fn()} />
      </>
    );

    await user.click(screen.getByRole("button", { name: "Mark as Playing" }));

    await waitFor(() =>
      expect(mocks.setStatusFn).toHaveBeenCalledWith({
        data: { id: 2, to: "PLAYING" },
      })
    );
    expect(await screen.findByText("Celeste is now Playing")).toBeDefined();
    expect(screen.getByRole("button", { name: "Undo" })).toBeDefined();
    expect(mocks.invalidate).toHaveBeenCalled();
  });
});
