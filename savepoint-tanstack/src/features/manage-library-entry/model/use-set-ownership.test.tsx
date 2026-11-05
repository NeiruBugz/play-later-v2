import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSetOwnership } from "./use-set-ownership";

const { setOwnershipFnMock, invalidateMock } = vi.hoisted(() => ({
  setOwnershipFnMock: vi.fn(),
  invalidateMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
}));
vi.mock("../api/set-ownership-fn", () => ({
  setOwnershipFn: setOwnershipFnMock,
}));
vi.mock("@/shared/lib/user-facing-error", () => ({
  SAVE_FAILED_MESSAGE: "Couldn't save. Try again.",
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

function Harness({ isOwned }: { isOwned: boolean }) {
  const state = useSetOwnership({ id: 7, gameTitle: "Hades", isOwned });
  return (
    <>
      <p>{state.isOwned ? "Owned" : "Not owned"}</p>
      <button type="button" onClick={() => void state.setOwned(!state.isOwned)}>
        Toggle
      </button>
      <Toaster />
    </>
  );
}

const elements = {
  getToggle: () => screen.getByRole("button", { name: "Toggle" }),
};

describe("useSetOwnership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateMock.mockResolvedValue(undefined);
  });

  describe("given an owned game", () => {
    it("shows not owned, saves it, and refreshes the route", async () => {
      setOwnershipFnMock.mockResolvedValue({ isOwned: false });
      render(<Harness isOwned />);

      await userEvent.click(elements.getToggle());

      expect(screen.getByText("Not owned")).toBeDefined();
      expect(setOwnershipFnMock).toHaveBeenCalledWith({
        data: { id: 7, isOwned: false },
      });
      await waitFor(() => expect(invalidateMock).toHaveBeenCalledTimes(1));
    });

    it("reverts, tells the user, and does not refresh when saving fails", async () => {
      setOwnershipFnMock.mockRejectedValue(new Error("offline"));
      render(<Harness isOwned />);

      await userEvent.click(elements.getToggle());

      expect(
        await screen.findByText("Couldn't save. Try again.")
      ).toBeDefined();
      expect(screen.getByText("Owned")).toBeDefined();
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });
});
