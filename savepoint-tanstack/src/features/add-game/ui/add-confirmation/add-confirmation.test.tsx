import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AddConfirmation } from "./add-confirmation";
import type { AddConfirmationProps } from "./add-confirmation.type";
import { ADD_CONFIRMATION_DURATION_MS } from "./add-confirmation.utility";

const onDismiss = vi.fn();
const onSaveWhy = vi.fn();

const elements = {
  getWhy: () => screen.getByLabelText("Why do you want to play this?"),
  queryWhy: () => screen.queryByLabelText("Why do you want to play this?"),
  getSave: () => screen.getByRole("button", { name: "Save" }),
};

function renderConfirmation(props: Partial<AddConfirmationProps> = {}) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <AddConfirmation
      gameTitle="Hades"
      status="WANT"
      upNextPosition={null}
      onUndo={vi.fn()}
      onSaveWhy={onSaveWhy}
      onDismiss={onDismiss}
      {...props}
    />
  );
  return user;
}

function passTime(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe("AddConfirmation why field", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    onSaveWhy.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the labelled field without taking focus", () => {
    renderConfirmation();
    expect(elements.getWhy()).not.toHaveFocus();
  });

  it("does not offer the field for a game already in the library", () => {
    renderConfirmation({ onUndo: undefined });
    expect(elements.queryWhy()).toBeNull();
  });

  it("dismisses after 8 s and saves nothing when the field is ignored", () => {
    renderConfirmation();
    passTime(ADD_CONFIRMATION_DURATION_MS);
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onSaveWhy).not.toHaveBeenCalled();
  });

  it("stays open past 8 s while the user is typing", async () => {
    const user = renderConfirmation();
    await user.type(elements.getWhy(), "Heard it is great");
    passTime(ADD_CONFIRMATION_DURATION_MS * 2);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("stays open while the field is focused and counts down again after it loses focus empty", async () => {
    const user = renderConfirmation();
    await user.click(elements.getWhy());
    passTime(ADD_CONFIRMATION_DURATION_MS * 2);
    expect(onDismiss).not.toHaveBeenCalled();
    await user.tab();
    passTime(ADD_CONFIRMATION_DURATION_MS);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("saves the answer on Enter and closes", async () => {
    const user = renderConfirmation();
    await user.type(elements.getWhy(), "Heard it is great{Enter}");
    expect(onSaveWhy).toHaveBeenCalledWith("Heard it is great");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("saves the answer on Save", async () => {
    const user = renderConfirmation();
    await user.type(elements.getWhy(), "Looks fun");
    await user.click(elements.getSave());
    expect(onSaveWhy).toHaveBeenCalledWith("Looks fun");
  });

  it("keeps the confirmation and the text when saving fails", async () => {
    onSaveWhy.mockResolvedValue(false);
    const user = renderConfirmation();
    await user.type(elements.getWhy(), "Looks fun{Enter}");
    expect(onDismiss).not.toHaveBeenCalled();
    expect(elements.getWhy()).toHaveValue("Looks fun");
  });
});
