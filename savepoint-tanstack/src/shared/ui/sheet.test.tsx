import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "Open filters", hidden: true }),
  queryDialog: () => screen.queryByRole("dialog"),
  queryTitle: () => screen.queryByText("Filters"),
  getCloseButton: () => screen.getByRole("button", { name: "Close" }),
};

const actions = {
  open: async () => userEvent.click(elements.getTrigger()),
  close: async () => userEvent.click(elements.getCloseButton()),
  pressEscape: async () => userEvent.keyboard("{Escape}"),
};

function Harness({ side }: { side?: "left" | "right" | "top" | "bottom" }) {
  return (
    <Sheet>
      <SheetTrigger>Open filters</SheetTrigger>
      <SheetContent side={side}>
        <SheetTitle>Filters</SheetTitle>
        <SheetDescription>Refine the library list</SheetDescription>
      </SheetContent>
    </Sheet>
  );
}

describe("Sheet", () => {
  describe("given default closed state", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("does not render the dialog", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the trigger is clicked", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.open();
    });

    it("renders the dialog", () => {
      expect(elements.queryDialog()).not.toBeNull();
    });

    it("renders the title", () => {
      expect(elements.queryTitle()).not.toBeNull();
    });

    it("closes when the close button is clicked", async () => {
      await actions.close();
      expect(elements.queryDialog()).toBeNull();
    });

    it("closes when Escape is pressed", async () => {
      await actions.pressEscape();
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given side='left' variant", () => {
    beforeEach(async () => {
      render(<Harness side="left" />);
      await actions.open();
    });

    it("renders with left-side classes", () => {
      const dialog = elements.queryDialog();
      expect(dialog?.className).toContain("left-0");
    });
  });
});
