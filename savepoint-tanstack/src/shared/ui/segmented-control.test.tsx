import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SegmentedControl } from "./segmented-control";

type Status = "a" | "b" | "c";

const options = [
  { value: "a" as const, label: "Option A" },
  { value: "b" as const, label: "Option B" },
  { value: "c" as const, label: "Option C" },
];

const elements = {
  getTab: (name: string) => screen.getByRole("tab", { name }),
  getTabList: () => screen.getByRole("tablist"),
  getIcon: () => screen.getByTestId("opt-icon"),
};

const actions = {
  clickTab: async (name: string) => userEvent.click(elements.getTab(name)),
  pressArrowRight: async () => userEvent.keyboard("{ArrowRight}"),
};

describe("SegmentedControl", () => {
  describe("given three options with value=a", () => {
    let onValueChange: (value: Status) => void;

    beforeEach(() => {
      onValueChange = vi.fn() as unknown as (value: Status) => void;
      render(
        <SegmentedControl<Status>
          value="a"
          onValueChange={onValueChange}
          options={options}
          ariaLabel="Pick a letter"
        />
      );
    });

    it("renders one tab per option", () => {
      expect(elements.getTab("Option A")).toBeDefined();
      expect(elements.getTab("Option B")).toBeDefined();
      expect(elements.getTab("Option C")).toBeDefined();
    });

    it("marks Option A as the active tab", () => {
      expect(elements.getTab("Option A")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(elements.getTab("Option B")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("forwards ariaLabel to the tablist", () => {
      expect(elements.getTabList()).toHaveAttribute(
        "aria-label",
        "Pick a letter"
      );
    });

    describe("when the user clicks Option B", () => {
      beforeEach(async () => {
        await actions.clickTab("Option B");
      });

      it("calls onValueChange with 'b'", () => {
        expect(onValueChange).toHaveBeenCalledWith("b");
      });
    });

    describe("when the user presses ArrowRight from Option A", () => {
      beforeEach(async () => {
        elements.getTab("Option A").focus();
        await actions.pressArrowRight();
      });

      it("calls onValueChange with 'b' (Radix arrow-key navigation)", () => {
        expect(onValueChange).toHaveBeenCalledWith("b");
      });
    });
  });

  describe("given an option with an icon", () => {
    beforeEach(() => {
      render(
        <SegmentedControl<Status>
          value="a"
          onValueChange={vi.fn()}
          options={[
            {
              value: "a",
              label: "Option A",
              icon: <span data-testid="opt-icon" />,
            },
            { value: "b", label: "Option B" },
          ]}
        />
      );
    });

    it("renders the icon alongside the label", () => {
      expect(elements.getIcon()).toBeDefined();
    });
  });

  describe("given value is empty string (no selection)", () => {
    beforeEach(() => {
      render(
        <SegmentedControl<Status>
          value=""
          onValueChange={vi.fn()}
          options={options}
        />
      );
    });

    it("marks no tab as selected", () => {
      expect(elements.getTab("Option A")).toHaveAttribute(
        "aria-selected",
        "false"
      );
      expect(elements.getTab("Option B")).toHaveAttribute(
        "aria-selected",
        "false"
      );
      expect(elements.getTab("Option C")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });
  });

  describe("given a disabled option", () => {
    let onValueChange: (value: Status) => void;

    beforeEach(async () => {
      onValueChange = vi.fn() as unknown as (value: Status) => void;
      render(
        <SegmentedControl<Status>
          value="a"
          onValueChange={onValueChange}
          options={[
            { value: "a", label: "Option A" },
            { value: "b", label: "Option B", disabled: true },
          ]}
        />
      );
      await actions.clickTab("Option B");
    });

    it("does not fire onValueChange for the disabled tab", () => {
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });
});
