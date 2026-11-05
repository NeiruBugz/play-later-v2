import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { PaletteQuickActionsGroup } from "./palette-quick-actions-group";

const elements = {
  queryItem: (name: string) => screen.queryByText(name),
  getOption: (name: string) => screen.getByRole("option", { name }),
  queryHeading: () => screen.queryByText("Quick actions"),
};

function renderGroup(query = "") {
  const onNewNote = vi.fn();
  render(
    <Command>
      <CommandList>
        <PaletteQuickActionsGroup query={query} onNewNote={onNewNote} />
      </CommandList>
    </Command>
  );
  return { onNewNote };
}

describe("PaletteQuickActionsGroup", () => {
  describe("given an empty query", () => {
    beforeEach(() => {
      renderGroup("");
    });

    it("offers New note and no Add game action", () => {
      expect(elements.queryItem("New note")).not.toBeNull();
      expect(elements.queryItem("Add game to library")).toBeNull();
    });
  });

  describe("given the user chooses 'New note'", () => {
    it("invokes the new-note callback", async () => {
      const { onNewNote } = renderGroup("");
      await userEvent.click(elements.getOption("New note"));
      expect(onNewNote).toHaveBeenCalledTimes(1);
    });
  });

  describe("given a query that matches nothing", () => {
    it("renders nothing", () => {
      renderGroup("zzzzz");
      expect(elements.queryHeading()).toBeNull();
    });
  });
});
