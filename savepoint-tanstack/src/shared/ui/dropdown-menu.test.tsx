import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const elements = {
  getTrigger: () =>
    screen.getByRole("button", { name: "Open menu", hidden: true }),
  queryMenu: () => screen.queryByRole("menu"),
  getItem: (name: string) => screen.getByRole("menuitem", { name }),
  queryItem: (name: string) => screen.queryByRole("menuitem", { name }),
};

const actions = {
  openMenu: async () => userEvent.click(elements.getTrigger()),
  pressKey: async (key: string) => userEvent.keyboard(key),
  clickItem: async (name: string) => userEvent.click(elements.getItem(name)),
};

const onSelect = vi.fn();

function Harness() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={onSelect}>Profile</DropdownMenuItem>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  beforeEach(() => {
    onSelect.mockReset();
  });

  describe("given default closed state", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("renders the trigger with aria-expanded=false", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("does not render the menu", () => {
      expect(elements.queryMenu()).toBeNull();
    });
  });

  describe("given the trigger has been clicked", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.openMenu();
    });

    it("sets aria-expanded=true on the trigger", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("renders all menu items", () => {
      expect(elements.queryItem("Profile")).not.toBeNull();
      expect(elements.queryItem("Sign out")).not.toBeNull();
    });

    it("invokes onSelect when an item is clicked", async () => {
      await actions.clickItem("Profile");
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it("closes when Escape is pressed", async () => {
      await actions.pressKey("{Escape}");
      expect(elements.queryMenu()).toBeNull();
    });
  });
});
