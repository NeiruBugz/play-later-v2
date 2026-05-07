import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RatingInput } from "./rating-input";

const elements = {
  getReadOnly: () => screen.getByRole("img"),
  getSlider: () => screen.getByRole("slider"),
  getStar: (index: number) => screen.getByTestId(`rating-star-${index}`),
};

const actions = {
  focusSlider: () => elements.getSlider().focus(),
  pressKey: async (key: string) => userEvent.keyboard(key),
  clickStarHalf: (index: number, side: "left" | "right") => {
    const el = elements.getStar(index);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      right: 20,
      top: 0,
      bottom: 20,
      width: 20,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect);
    fireEvent.click(el, { clientX: side === "left" ? 4 : 16, clientY: 10 });
  },
};

describe("RatingInput", () => {
  describe("given readOnly mode with a value", () => {
    beforeEach(() => {
      render(<RatingInput value={6} readOnly />);
    });

    it("renders with role='img'", () => {
      expect(elements.getReadOnly()).toBeDefined();
    });

    it("computes a 'X out of 5 stars' aria-label", () => {
      expect(elements.getReadOnly()).toHaveAttribute(
        "aria-label",
        "3 out of 5 stars"
      );
    });
  });

  describe("given readOnly mode with null value", () => {
    beforeEach(() => {
      render(<RatingInput value={null} readOnly />);
    });

    it("renders 'No rating' aria-label", () => {
      expect(elements.getReadOnly()).toHaveAttribute("aria-label", "No rating");
    });
  });

  describe("given interactive mode (readOnly=false)", () => {
    const onChange = vi.fn();

    beforeEach(() => {
      onChange.mockReset();
      render(<RatingInput value={null} readOnly={false} onChange={onChange} />);
    });

    it("renders with role='slider'", () => {
      expect(elements.getSlider()).toBeDefined();
    });

    it("invokes onChange with the right-half rating when a star right-half is clicked", () => {
      actions.clickStarHalf(3, "right");
      expect(onChange).toHaveBeenCalledWith(6);
    });

    it("invokes onChange with the left-half (odd) rating when a star left-half is clicked", () => {
      actions.clickStarHalf(3, "left");
      expect(onChange).toHaveBeenCalledWith(5);
    });

    it("supports keyboard ArrowRight to preview-increment then Enter to commit", async () => {
      actions.focusSlider();
      await actions.pressKey("{ArrowRight}{Enter}");
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("clears the rating on Escape", async () => {
      actions.focusSlider();
      await actions.pressKey("{Escape}");
      expect(onChange).toHaveBeenCalledWith(null);
    });
  });
});
