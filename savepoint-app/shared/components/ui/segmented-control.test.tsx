import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SegmentedControl, SegmentedControlItem } from "./segmented-control";

describe("SegmentedControl", () => {
  it("renders all items", () => {
    render(
      <SegmentedControl value="a" onValueChange={vi.fn()}>
        <SegmentedControlItem value="a">Option A</SegmentedControlItem>
        <SegmentedControlItem value="b">Option B</SegmentedControlItem>
      </SegmentedControl>
    );

    expect(screen.getByRole("tab", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Option B" })).toBeInTheDocument();
  });

  it("marks the active item as selected", () => {
    render(
      <SegmentedControl value="b" onValueChange={vi.fn()}>
        <SegmentedControlItem value="a">Option A</SegmentedControlItem>
        <SegmentedControlItem value="b">Option B</SegmentedControlItem>
      </SegmentedControl>
    );

    expect(screen.getByRole("tab", { name: "Option B" })).toHaveAttribute(
      "data-state",
      "active"
    );
    expect(screen.getByRole("tab", { name: "Option A" })).toHaveAttribute(
      "data-state",
      "inactive"
    );
  });

  it("calls onValueChange when a different item is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <SegmentedControl value="a" onValueChange={handleChange}>
        <SegmentedControlItem value="a">Option A</SegmentedControlItem>
        <SegmentedControlItem value="b">Option B</SegmentedControlItem>
      </SegmentedControl>
    );

    await user.click(screen.getByRole("tab", { name: "Option B" }));
    expect(handleChange).toHaveBeenCalledWith("b");
  });

  it("renders with aria-label when provided", () => {
    render(
      <SegmentedControl
        value="a"
        onValueChange={vi.fn()}
        ariaLabel="Choose status"
      >
        <SegmentedControlItem value="a">Option A</SegmentedControlItem>
      </SegmentedControl>
    );

    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-label",
      "Choose status"
    );
  });

  it("renders icon alongside label when icon prop is provided", () => {
    render(
      <SegmentedControl value="a" onValueChange={vi.fn()}>
        <SegmentedControlItem value="a" icon={<span data-testid="test-icon" />}>
          Option A
        </SegmentedControlItem>
      </SegmentedControl>
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
  });
});
