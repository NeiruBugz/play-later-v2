import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "Hover me", hidden: true }),
  queryTooltip: () => screen.queryByRole("tooltip"),
};

const actions = {
  focusTrigger: async () => elements.getTrigger().focus(),
  blurTrigger: async () => elements.getTrigger().blur(),
  pressTab: async () => userEvent.tab(),
};

function Harness() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe("Tooltip", () => {
  describe("given default state", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("does not render the tooltip content", () => {
      expect(elements.queryTooltip()).toBeNull();
    });
  });

  describe("given the trigger receives focus", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.focusTrigger();
    });

    it("renders the tooltip with role='tooltip'", () => {
      expect(elements.queryTooltip()).not.toBeNull();
    });

    it("renders the tooltip text", () => {
      expect(elements.queryTooltip()?.textContent).toContain("Tooltip text");
    });
  });
});
