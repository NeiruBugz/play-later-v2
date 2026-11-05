import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DoneOutcomeLabel } from "./done-outcome-label";

const mocks = vi.hoisted(() => ({
  setDoneOutcomeFn: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@/features/done-follow-up", () => ({
  setDoneOutcomeFn: mocks.setDoneOutcomeFn,
}));
vi.mock("@/shared/lib/user-facing-error", () => ({
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

function renderLabel() {
  return render(
    <>
      <DoneOutcomeLabel libraryItemId={7} doneOutcome="LET_GO" />
      <Toaster />
    </>
  );
}

describe("DoneOutcomeLabel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setDoneOutcomeFn.mockResolvedValue({ doneOutcome: "FINISHED" });
  });

  it("shows Done · Let go and switches to Done · Finished when edited", async () => {
    renderLabel();
    expect(screen.getByText("Done · Let go")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Done · Let go/ })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Finished" })
    );

    expect(await screen.findByText("Done · Finished")).toBeInTheDocument();
    expect(mocks.setDoneOutcomeFn).toHaveBeenCalledWith({
      data: { id: 7, outcome: "FINISHED" },
    });
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalled());
  });

  it("rolls back and shows the mapped copy when saving fails", async () => {
    mocks.setDoneOutcomeFn.mockRejectedValue(new Error("boom"));
    renderLabel();

    await userEvent.click(
      screen.getByRole("button", { name: /Done · Let go/ })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Finished" })
    );

    expect(
      await screen.findByText("Couldn't save. Try again.")
    ).toBeInTheDocument();
    expect(screen.getByText("Done · Let go")).toBeInTheDocument();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
