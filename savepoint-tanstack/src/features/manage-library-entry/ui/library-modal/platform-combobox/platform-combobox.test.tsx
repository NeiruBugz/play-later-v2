/**
 * Component test for PlatformCombobox (manage-library-entry).
 *
 * Contract:
 *   - The trigger is a button (accessible name "Platform") showing the current
 *     value, or "No platform" when empty.
 *   - Opening reveals a searchable list grouped by provenance ("This game",
 *     "Your platforms") plus a "No platform" clear option.
 *   - Typing filters the listed platforms.
 *   - Any query not already listed surfaces an `Add "<query>"` create item, so
 *     a user can record a platform that is in no group (e.g. "Steam Deck").
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlatformOptions } from "../../../api/get-platform-options.constants";
import { PlatformCombobox } from "./platform-combobox";

const GROUPS: PlatformOptions = [
  { label: "This game", platforms: ["PC", "Switch"] },
  { label: "Your platforms", platforms: ["PlayStation 5"] },
];

const onChange = vi.fn();
const searchRemote = vi.fn();

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Platform" }),
  getSearchInput: () =>
    screen.getByPlaceholderText("Search or add a platform…"),
  getOption: (name: string) => screen.getByRole("option", { name }),
  queryOption: (name: string) => screen.queryByRole("option", { name }),
  findOption: (name: string) => screen.findByRole("option", { name }),
  getAllOptions: (name: string) => screen.getAllByRole("option", { name }),
  getGroupHeading: (name: string) => screen.getByText(name),
};

const actions = {
  open: () => userEvent.click(elements.getTrigger()),
  type: (text: string) => userEvent.type(elements.getSearchInput(), text),
  selectOption: (name: string) => userEvent.click(elements.getOption(name)),
};

describe("PlatformCombobox", () => {
  beforeEach(() => {
    onChange.mockReset();
    searchRemote.mockReset();
  });

  describe("given an empty value", () => {
    beforeEach(() => {
      render(<PlatformCombobox value="" groups={GROUPS} onChange={onChange} />);
    });

    it("shows 'No platform' on the trigger", () => {
      expect(elements.getTrigger().textContent).toContain("No platform");
    });
  });

  describe("given a selected value", () => {
    beforeEach(() => {
      render(
        <PlatformCombobox value="PC" groups={GROUPS} onChange={onChange} />
      );
    });

    it("shows the current value on the trigger", () => {
      expect(elements.getTrigger().textContent).toContain("PC");
    });
  });

  describe("given the combobox is opened", () => {
    beforeEach(async () => {
      render(<PlatformCombobox value="" groups={GROUPS} onChange={onChange} />);
      await actions.open();
    });

    it("shows the group headings", () => {
      expect(elements.getGroupHeading("This game")).toBeInTheDocument();
      expect(elements.getGroupHeading("Your platforms")).toBeInTheDocument();
    });

    it("lists the platforms from every group", () => {
      expect(elements.getOption("PC")).toBeInTheDocument();
      expect(elements.getOption("Switch")).toBeInTheDocument();
      expect(elements.getOption("PlayStation 5")).toBeInTheDocument();
    });

    it("offers a 'No platform' clear option", () => {
      expect(elements.getOption("No platform")).toBeInTheDocument();
    });
  });

  describe("given the user clicks 'No platform'", () => {
    beforeEach(async () => {
      render(
        <PlatformCombobox value="PC" groups={GROUPS} onChange={onChange} />
      );
      await actions.open();
      await actions.selectOption("No platform");
    });

    it("calls onChange with an empty string", () => {
      expect(onChange).toHaveBeenCalledWith("");
    });
  });

  describe("given the user picks a listed platform", () => {
    beforeEach(async () => {
      render(<PlatformCombobox value="" groups={GROUPS} onChange={onChange} />);
      await actions.open();
      await actions.selectOption("Switch");
    });

    it("calls onChange with that platform", () => {
      expect(onChange).toHaveBeenCalledWith("Switch");
    });
  });

  describe("given the user types a query that matches a listed platform", () => {
    beforeEach(async () => {
      render(<PlatformCombobox value="" groups={GROUPS} onChange={onChange} />);
      await actions.open();
      await actions.type("PC");
    });

    it("keeps the matching platform visible", () => {
      expect(elements.getOption("PC")).toBeInTheDocument();
    });

    it("hides the non-matching platforms", () => {
      expect(elements.queryOption("Switch")).toBeNull();
    });
  });

  describe("given the user types a platform that is in no group", () => {
    beforeEach(async () => {
      render(<PlatformCombobox value="" groups={GROUPS} onChange={onChange} />);
      await actions.open();
      await actions.type("Steam Deck");
    });

    it("surfaces an add affordance for the typed value", () => {
      expect(elements.getOption('Add "Steam Deck"')).toBeInTheDocument();
    });

    it("calls onChange with the trimmed typed value when the add item is clicked", async () => {
      await actions.selectOption('Add "Steam Deck"');
      expect(onChange).toHaveBeenCalledWith("Steam Deck");
    });
  });

  describe("given searchRemote is provided and the user types a 2+ char query", () => {
    beforeEach(async () => {
      searchRemote.mockResolvedValue(["Xbox Series X|S", "Xbox One"]);
      render(
        <PlatformCombobox
          value=""
          groups={GROUPS}
          onChange={onChange}
          searchRemote={searchRemote}
        />
      );
      await actions.open();
      await actions.type("Xbox");
    });

    it("renders the remote results under the Search results heading", async () => {
      expect(await elements.findOption("Xbox Series X|S")).toBeInTheDocument();
      expect(elements.getGroupHeading("Search results")).toBeInTheDocument();
    });

    it("calls onChange when a remote result is selected", async () => {
      await userEvent.click(await elements.findOption("Xbox One"));
      expect(onChange).toHaveBeenCalledWith("Xbox One");
    });
  });

  describe("given a remote result duplicates a local group platform", () => {
    beforeEach(async () => {
      searchRemote.mockResolvedValue(["Switch", "Switch 2"]);
      render(
        <PlatformCombobox
          value=""
          groups={GROUPS}
          onChange={onChange}
          searchRemote={searchRemote}
        />
      );
      await actions.open();
      await actions.type("Switch");
    });

    it("renders the new remote result", async () => {
      expect(await elements.findOption("Switch 2")).toBeInTheDocument();
    });

    it("does not duplicate a platform already present in a local group", async () => {
      await elements.findOption("Switch 2");
      expect(elements.getAllOptions("Switch")).toHaveLength(1);
    });
  });

  describe("given searchRemote is provided and the user types a 1 char query", () => {
    beforeEach(async () => {
      searchRemote.mockResolvedValue(["Xbox One"]);
      render(
        <PlatformCombobox
          value=""
          groups={GROUPS}
          onChange={onChange}
          searchRemote={searchRemote}
        />
      );
      await actions.open();
      await actions.type("X");
    });

    it("does not call searchRemote", async () => {
      await waitFor(() => {
        expect(searchRemote).not.toHaveBeenCalled();
      });
    });
  });
});
