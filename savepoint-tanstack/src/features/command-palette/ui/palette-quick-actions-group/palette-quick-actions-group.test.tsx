import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { PaletteQuickActionsGroup } from "./palette-quick-actions-group";

const elements = {
  queryItem: (name: string) => screen.queryByText(name),
  getItem: (name: string) => screen.getByText(name),
  getOption: (name: string) => screen.getByRole("option", { name }),
  queryHeading: () => screen.queryByText("Quick actions"),
};

function renderGroup(query = "") {
  const onFocusSearch = vi.fn();
  const onNewJournalEntry = vi.fn();
  render(
    <Command>
      <CommandList>
        <PaletteQuickActionsGroup
          query={query}
          onFocusSearch={onFocusSearch}
          onNewJournalEntry={onNewJournalEntry}
        />
      </CommandList>
    </Command>
  );
  return { onFocusSearch, onNewJournalEntry };
}

describe("PaletteQuickActionsGroup", () => {
  describe("given an empty query", () => {
    beforeEach(() => {
      renderGroup("");
    });

    it("renders both quick actions", () => {
      expect(elements.queryItem("Add game to library")).not.toBeNull();
      expect(elements.queryItem("New journal entry")).not.toBeNull();
    });
  });

  describe("given the user clicks 'Add game to library'", () => {
    let onFocusSearch: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      ({ onFocusSearch } = renderGroup(""));
      await userEvent.click(elements.getOption("Add game to library"));
    });

    it("invokes the focus-search callback", () => {
      expect(onFocusSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the user clicks 'New journal entry'", () => {
    let onNewJournalEntry: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      ({ onNewJournalEntry } = renderGroup(""));
      await userEvent.click(elements.getOption("New journal entry"));
    });

    it("invokes the new-journal-entry callback", () => {
      expect(onNewJournalEntry).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a query that matches one action", () => {
    beforeEach(() => {
      renderGroup("journal");
    });

    it("filters out non-matching items", () => {
      expect(elements.queryItem("Add game to library")).toBeNull();
      expect(elements.queryItem("New journal entry")).not.toBeNull();
    });
  });

  describe("given a query that matches nothing", () => {
    beforeEach(() => {
      renderGroup("zzzzz");
    });

    it("renders nothing", () => {
      expect(elements.queryHeading()).toBeNull();
    });
  });
});
