import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DoneFollowUp } from "./done-follow-up";

const mocks = vi.hoisted(() => ({ saveDoneFollowUpFn: vi.fn() }));

vi.mock("../../api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: mocks.saveDoneFollowUpFn,
}));
vi.mock("@/shared/lib/use-media-query", () => ({ useIsDesktop: () => true }));
vi.mock("@/shared/lib/user-facing-error", () => ({
  getUserFacingErrorMessage: () => "Couldn't save. Try again.",
}));

const handlers = {
  onClose: vi.fn(),
  onUndo: vi.fn(),
  onSaved: vi.fn(),
};

function renderFollowUp(currentRating: number | null = 7) {
  return render(
    <DoneFollowUp
      itemId={7}
      gameTitle="Hades"
      currentRating={currentRating}
      {...handlers}
    />
  );
}

const elements = {
  getFinished: () => screen.getByRole("radio", { name: "Finished" }),
  getLetGo: () => screen.getByRole("radio", { name: "Let go" }),
  getRating: () => screen.getByRole("slider", { name: "Rating" }),
  getStayed: () => screen.getByLabelText("What stayed with you?"),
  getSave: () => screen.getByRole("button", { name: "Save" }),
  getSkip: () => screen.getByRole("button", { name: "Skip" }),
  getUndo: () => screen.getByRole("button", { name: "Undo" }),
};

describe("DoneFollowUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.onUndo.mockResolvedValue(undefined);
    mocks.saveDoneFollowUpFn.mockResolvedValue({});
  });

  it("opens with neither outcome selected, the current rating, and the three buttons", () => {
    renderFollowUp(7);

    expect(screen.getByText("How did it end?")).toBeInTheDocument();
    expect(elements.getFinished()).not.toBeChecked();
    expect(elements.getLetGo()).not.toBeChecked();
    expect(elements.getRating()).toHaveAttribute("aria-valuenow", "7");
    expect(elements.getStayed()).toHaveValue("");
    expect(elements.getSave()).toBeEnabled();
    expect(elements.getSkip()).toBeEnabled();
    expect(elements.getUndo()).toBeEnabled();
  });

  it.each([
    ["Skip", () => userEvent.click(elements.getSkip())],
    ["Escape", () => userEvent.keyboard("{Escape}")],
    [
      "the close button",
      () => userEvent.click(screen.getByRole("button", { name: /close/i })),
    ],
  ])("%s closes and records nothing", async (_name, close) => {
    renderFollowUp();

    await close();

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
    expect(mocks.saveDoneFollowUpFn).not.toHaveBeenCalled();
    expect(handlers.onUndo).not.toHaveBeenCalled();
  });

  it("Save sends the outcome, the changed rating and the text", async () => {
    renderFollowUp(null);

    await userEvent.click(elements.getLetGo());
    elements.getRating().focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}{Enter}");
    await userEvent.type(elements.getStayed(), "  The ending  ");
    await userEvent.click(elements.getSave());

    await waitFor(() =>
      expect(mocks.saveDoneFollowUpFn).toHaveBeenCalledWith({
        data: { id: 7, outcome: "LET_GO", rating: 2, stayed: "The ending" },
      })
    );
    expect(handlers.onSaved).toHaveBeenCalled();
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("does not resend an unchanged rating", async () => {
    renderFollowUp(7);

    await userEvent.click(elements.getFinished());
    await userEvent.click(elements.getSave());

    await waitFor(() =>
      expect(mocks.saveDoneFollowUpFn).toHaveBeenCalledWith({
        data: { id: 7, outcome: "FINISHED" },
      })
    );
  });

  it("stays open with the entered values when saving fails", async () => {
    mocks.saveDoneFollowUpFn.mockRejectedValue(new Error("boom"));
    renderFollowUp();

    await userEvent.click(elements.getFinished());
    await userEvent.type(elements.getStayed(), "Great");
    await userEvent.click(elements.getSave());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't save. Try again."
    );
    expect(handlers.onClose).not.toHaveBeenCalled();
    expect(elements.getFinished()).toBeChecked();
    expect(elements.getStayed()).toHaveValue("Great");
    expect(elements.getSave()).toBeEnabled();
  });

  it("Undo runs the injected undo, saves nothing and closes", async () => {
    renderFollowUp();

    await userEvent.type(elements.getStayed(), "Great");
    await userEvent.click(elements.getUndo());

    await waitFor(() => expect(handlers.onClose).toHaveBeenCalled());
    expect(handlers.onUndo).toHaveBeenCalledTimes(1);
    expect(mocks.saveDoneFollowUpFn).not.toHaveBeenCalled();
  });
});
