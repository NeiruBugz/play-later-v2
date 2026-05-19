import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UndoToastBody } from "./undo-toast";

const elements = {
  queryUndoButton: () => screen.queryByRole("button", { name: "Undo" }),
  getUndoButton: () => screen.getByRole("button", { name: "Undo" }),
  queryMessage: (text: string) => screen.queryByText(text),
};

describe("UndoToastBody", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given a message and onUndo callback", () => {
    beforeEach(() => {
      render(
        <UndoToastBody
          message='Added "Hades" to Up Next'
          onUndo={() => {}}
          durationMs={5000}
        />
      );
    });

    it("renders the message text", () => {
      expect(elements.queryMessage('Added "Hades" to Up Next')).not.toBeNull();
    });

    it("renders the Undo button", () => {
      expect(elements.queryUndoButton()).not.toBeNull();
    });
  });

  describe("given the Undo button is clicked before expiry", () => {
    it("invokes the onUndo callback", async () => {
      vi.useRealTimers();
      const onUndo = vi.fn();
      const user = userEvent.setup();

      render(
        <UndoToastBody message="Added" onUndo={onUndo} durationMs={5000} />
      );

      await user.click(elements.getUndoButton());
      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the duration expires without clicking Undo", () => {
    it("removes the Undo button from the DOM", () => {
      const onUndo = vi.fn();

      render(
        <UndoToastBody message="Added" onUndo={onUndo} durationMs={5000} />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(elements.queryUndoButton()).toBeNull();
    });

    it("does not invoke onUndo on expiry", () => {
      const onUndo = vi.fn();

      render(
        <UndoToastBody message="Added" onUndo={onUndo} durationMs={5000} />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onUndo).not.toHaveBeenCalled();
    });

    it("invokes the optional onExpire callback", () => {
      const onExpire = vi.fn();

      render(
        <UndoToastBody
          message="Added"
          onUndo={() => {}}
          durationMs={5000}
          onExpire={onExpire}
        />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onExpire).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the timer has not yet reached the duration", () => {
    it("keeps the Undo button visible right up until expiry", () => {
      render(
        <UndoToastBody message="Added" onUndo={() => {}} durationMs={5000} />
      );

      act(() => {
        vi.advanceTimersByTime(4999);
      });

      expect(elements.queryUndoButton()).not.toBeNull();
    });
  });
});
