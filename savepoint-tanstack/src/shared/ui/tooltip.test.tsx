import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Hover me" }),
  queryTooltipText: () => screen.queryByText("Tooltip text"),
  findTooltipText: () => screen.findByText("Tooltip text"),
};

const actions = {
  hoverTrigger: () => userEvent.hover(elements.getTrigger()),
  unhoverTrigger: () => userEvent.unhover(elements.getTrigger()),
  focusWithKeyboard: () => userEvent.tab(),
  pressEscape: () => userEvent.keyboard("{Escape}"),
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

describe("Tooltip shows its text to the user", () => {
  describe("given the tooltip has not been triggered", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("shows no tooltip text", () => {
      expect(elements.queryTooltipText()).toBeNull();
    });
  });

  describe("given the pointer hovers the trigger", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.hoverTrigger();
    });

    it("shows the tooltip text", async () => {
      expect(await elements.findTooltipText()).toBeVisible();
    });

    it("hides the text again when the pointer leaves", async () => {
      await elements.findTooltipText();
      await actions.unhoverTrigger();
      await waitFor(() => expect(elements.queryTooltipText()).toBeNull());
    });
  });

  describe("given the trigger receives keyboard focus", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.focusWithKeyboard();
    });

    it("shows the tooltip text", async () => {
      expect(await elements.findTooltipText()).toBeVisible();
    });

    it("hides the text when Escape is pressed", async () => {
      await elements.findTooltipText();
      await actions.pressEscape();
      await waitFor(() => expect(elements.queryTooltipText()).toBeNull());
    });
  });
});
