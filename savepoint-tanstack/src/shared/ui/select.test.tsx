import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const elements = {
  getTrigger: () =>
    screen.getByRole("combobox", { name: "Status", hidden: true }),
  queryOption: (name: string) =>
    screen.queryByRole("option", { name, hidden: true }),
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
};

const actions = {
  openTrigger: async () => userEvent.click(elements.getTrigger()),
  pickOption: async (name: string) => userEvent.click(elements.getOption(name)),
};

const onValueChange = vi.fn();

const STATUS_ITEMS = [
  { value: "playing", label: "Playing" },
  { value: "played", label: "Played" },
];

function ControlledHarness() {
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <Select
      value={value}
      items={STATUS_ITEMS}
      onValueChange={(v) => {
        setValue(v);
        onValueChange(v);
      }}
    >
      <SelectTrigger aria-label="Status">
        <SelectValue placeholder="Pick status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="playing">Playing</SelectItem>
        <SelectItem value="played">Played</SelectItem>
      </SelectContent>
    </Select>
  );
}

function UncontrolledHarness() {
  return (
    <Select defaultValue="played" items={STATUS_ITEMS}>
      <SelectTrigger aria-label="Status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="playing">Playing</SelectItem>
        <SelectItem value="played">Played</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe("Select", () => {
  beforeEach(() => {
    onValueChange.mockReset();
  });

  describe("given controlled mode", () => {
    beforeEach(() => {
      render(<ControlledHarness />);
    });

    it("renders the placeholder text in the trigger", () => {
      expect(elements.getTrigger().textContent).toContain("Pick status");
    });

    it("opens the listbox when the trigger is clicked", async () => {
      await actions.openTrigger();
      expect(elements.queryOption("Playing")).not.toBeNull();
    });

    it("invokes onValueChange when an option is picked", async () => {
      await actions.openTrigger();
      await actions.pickOption("Playing");
      expect(onValueChange).toHaveBeenCalledWith("playing");
    });
  });

  describe("given uncontrolled mode with defaultValue", () => {
    beforeEach(() => {
      render(<UncontrolledHarness />);
    });

    it("renders the default value's label in the trigger, not the raw value", () => {
      expect(elements.getTrigger().textContent).toContain("Played");
    });
  });

  describe("given the trigger is focused and the user presses Enter", () => {
    beforeEach(async () => {
      render(<ControlledHarness />);
      elements.getTrigger().focus();
      await userEvent.keyboard("{Enter}");
    });

    it("opens the listbox", () => {
      expect(elements.queryOption("Playing")).not.toBeNull();
    });

    it("selects the highlighted option with ArrowDown then Enter", async () => {
      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("played");
    });

    it("shows the picked option's label in the trigger", async () => {
      await userEvent.keyboard("{ArrowDown}{Enter}");
      expect(elements.getTrigger().textContent).toContain("Played");
    });

    it("closes on Escape and returns focus to the trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "false")
      );
      expect(elements.getTrigger()).toHaveFocus();
    });
  });

  describe("given the trigger is focused and the user presses ArrowDown", () => {
    beforeEach(async () => {
      render(<ControlledHarness />);
      elements.getTrigger().focus();
      await userEvent.keyboard("{ArrowDown}");
    });

    it("opens the listbox", () => {
      expect(elements.queryOption("Played")).not.toBeNull();
    });
  });
});
