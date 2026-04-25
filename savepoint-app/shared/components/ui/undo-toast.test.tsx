import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UndoToastBody } from "./undo-toast";

describe("UndoToastBody", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the message and Undo button", () => {
    render(
      <UndoToastBody
        message='Added "Elden Ring" to Up Next'
        onUndo={() => {}}
        durationMs={5000}
      />
    );

    expect(
      screen.getByText('Added "Elden Ring" to Up Next')
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });

  it("invokes onUndo when the Undo button is clicked within the duration", async () => {
    vi.useRealTimers();
    const onUndo = vi.fn();
    const user = userEvent.setup();

    render(<UndoToastBody message="Added" onUndo={onUndo} durationMs={5000} />);

    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("removes itself after duration expires without invoking onUndo", () => {
    const onUndo = vi.fn();
    const onExpire = vi.fn();

    render(
      <UndoToastBody
        message="Added"
        onUndo={onUndo}
        durationMs={5000}
        onExpire={onExpire}
      />
    );

    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(
      screen.queryByRole("button", { name: /undo/i })
    ).not.toBeInTheDocument();
    expect(onUndo).not.toHaveBeenCalled();
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("Undo remains available right up until expiry", () => {
    const onUndo = vi.fn();
    render(<UndoToastBody message="Added" onUndo={onUndo} durationMs={5000} />);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });
});
