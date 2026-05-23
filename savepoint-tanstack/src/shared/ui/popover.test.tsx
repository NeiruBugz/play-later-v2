import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { Popover, PopoverContent, PopoverTrigger } from "./popover";

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "Open popover", hidden: true }),
  queryContent: () => screen.queryByText("Popover body"),
};

const actions = {
  open: async () => userEvent.click(elements.getTrigger()),
  pressEscape: async () => userEvent.keyboard("{Escape}"),
};

function Harness() {
  return (
    <Popover>
      <PopoverTrigger>Open popover</PopoverTrigger>
      <PopoverContent>Popover body</PopoverContent>
    </Popover>
  );
}

describe("Popover", () => {
  describe("given default closed state", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("does not render the content", () => {
      expect(elements.queryContent()).toBeNull();
    });

    it("sets aria-expanded=false on the trigger", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("given the trigger is clicked", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.open();
    });

    it("renders the content", () => {
      expect(elements.queryContent()).not.toBeNull();
    });

    it("sets aria-expanded=true on the trigger", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("closes when Escape is pressed", async () => {
      await actions.pressEscape();
      expect(elements.queryContent()).toBeNull();
    });
  });
});
