import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";

const elements = {
  getInput: () => screen.getByRole("combobox"),
  queryItem: (name: string) => screen.queryByRole("option", { name }),
  getItem: (name: string) => screen.getByRole("option", { name }),
  queryEmpty: () => screen.queryByText("No results."),
};

const actions = {
  type: async (text: string) => userEvent.type(elements.getInput(), text),
  pressKey: async (key: string) => userEvent.keyboard(key),
  clickItem: async (name: string) => userEvent.click(elements.getItem(name)),
};

const onSelect = vi.fn();

function Harness() {
  return (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup>
          <CommandItem value="playstation" onSelect={onSelect}>
            PlayStation
          </CommandItem>
          <CommandItem value="xbox">Xbox</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

describe("Command", () => {
  beforeEach(() => {
    onSelect.mockReset();
  });

  describe("given default render", () => {
    beforeEach(() => {
      render(<Harness />);
    });

    it("renders the search combobox input", () => {
      expect(elements.getInput()).toBeDefined();
    });

    it("renders all items", () => {
      expect(elements.queryItem("PlayStation")).not.toBeNull();
      expect(elements.queryItem("Xbox")).not.toBeNull();
    });
  });

  describe("given the user types a non-matching query", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.type("zzzzz");
    });

    it("renders the empty state", () => {
      expect(elements.queryEmpty()).not.toBeNull();
    });
  });

  describe("given the user types a matching query", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.type("xbox");
    });

    it("filters the items to the match", () => {
      expect(elements.queryItem("Xbox")).not.toBeNull();
      expect(elements.queryItem("PlayStation")).toBeNull();
    });
  });

  describe("given the user clicks an item", () => {
    beforeEach(async () => {
      render(<Harness />);
      await actions.clickItem("PlayStation");
    });

    it("invokes onSelect with the item value", () => {
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("playstation");
    });
  });
});
