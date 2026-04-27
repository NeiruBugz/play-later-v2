import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RatingInput } from "./rating-input";

function getStarContainer(index: number): HTMLElement {
  return screen.getByTestId(`rating-star-${index}`);
}

function mouseOverHalf(el: HTMLElement, side: "left" | "right") {
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
  fireEvent.mouseMove(el, {
    clientX: side === "left" ? 4 : 16,
    clientY: 10,
  });
}

function clickHalf(el: HTMLElement, side: "left" | "right") {
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
  fireEvent.click(el, {
    clientX: side === "left" ? 4 : 16,
    clientY: 10,
  });
}

describe("RatingInput", () => {
  describe("readOnly mode", () => {
    it("renders with role img and does not expose interactive handlers", () => {
      const onChange = vi.fn();
      render(<RatingInput value={6} onChange={onChange} />);
      const root = screen.getByRole("img");
      expect(root).toBeInTheDocument();
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      expect(screen.queryByTestId("rating-star-1")).not.toBeInTheDocument();
    });

    it("uses computed a11y label when no rating", () => {
      render(<RatingInput value={null} />);
      expect(screen.getByRole("img")).toHaveAttribute(
        "aria-label",
        "No rating"
      );
    });

    it("hover on readOnly does not call onChange", () => {
      const onChange = vi.fn();
      render(<RatingInput value={4} onChange={onChange} />);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("interactive mode", () => {
    it("renders as slider with aria attributes", () => {
      render(
        <RatingInput
          value={6}
          readOnly={false}
          onChange={vi.fn()}
          aria-label="Rate this game"
        />
      );
      const slider = screen.getByRole("slider");
      expect(slider).toHaveAttribute("aria-valuemin", "1");
      expect(slider).toHaveAttribute("aria-valuemax", "10");
      expect(slider).toHaveAttribute("aria-valuenow", "6");
      expect(slider).toHaveAttribute("aria-label", "Rate this game");
      expect(slider).toHaveAttribute("tabindex", "0");
    });

    it("hovering left half of star 3 previews value 5 via aria-valuenow", () => {
      render(<RatingInput value={null} readOnly={false} onChange={vi.fn()} />);
      mouseOverHalf(getStarContainer(3), "left");
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "5");
    });

    it("hovering right half of star 3 previews value 6", () => {
      render(<RatingInput value={null} readOnly={false} onChange={vi.fn()} />);
      mouseOverHalf(getStarContainer(3), "right");
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "6");
    });

    it("leaving the component restores preview to current value", () => {
      render(<RatingInput value={4} readOnly={false} onChange={vi.fn()} />);
      mouseOverHalf(getStarContainer(5), "right");
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "10");
      fireEvent.mouseLeave(screen.getByRole("slider"));
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "4");
    });

    it("click commits the previewed value", () => {
      const onChange = vi.fn();
      render(<RatingInput value={null} readOnly={false} onChange={onChange} />);
      clickHalf(getStarContainer(4), "right");
      expect(onChange).toHaveBeenCalledWith(8);
    });

    it("click on currently-selected value clears (onChange null)", () => {
      const onChange = vi.fn();
      render(<RatingInput value={8} readOnly={false} onChange={onChange} />);
      clickHalf(getStarContainer(4), "right");
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("ArrowRight increases preview by 1 half-step", async () => {
      const user = userEvent.setup();
      render(<RatingInput value={4} readOnly={false} onChange={vi.fn()} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(slider).toHaveAttribute("aria-valuenow", "5");
    });

    it("ArrowLeft decreases preview by 1 half-step", async () => {
      const user = userEvent.setup();
      render(<RatingInput value={4} readOnly={false} onChange={vi.fn()} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowLeft}");
      expect(slider).toHaveAttribute("aria-valuenow", "3");
    });

    it("keyboard is bounded to [1,10]", async () => {
      const user = userEvent.setup();
      render(<RatingInput value={10} readOnly={false} onChange={vi.fn()} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      expect(slider).toHaveAttribute("aria-valuenow", "10");
    });

    it("Enter commits the preview", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<RatingInput value={4} readOnly={false} onChange={onChange} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{Enter}");
      expect(onChange).toHaveBeenCalledWith(5);
    });

    it("Escape clears the value", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<RatingInput value={6} readOnly={false} onChange={onChange} />);
      const slider = screen.getByRole("slider");
      slider.focus();
      await user.keyboard("{Escape}");
      expect(onChange).toHaveBeenCalledWith(null);
    });

    it("debounces rapid double click within 150ms (only one commit)", () => {
      const onChange = vi.fn();
      render(<RatingInput value={null} readOnly={false} onChange={onChange} />);
      const star = getStarContainer(4);
      clickHalf(star, "right");
      clickHalf(star, "right");
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
});
