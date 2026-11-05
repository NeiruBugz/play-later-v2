import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { JournalGameFilter } from "./journal-game-filter";

const onChange = vi.fn();

const options = [
  { id: "game-1", title: "Celeste" },
  { id: "game-2", title: "Hollow Knight" },
];

const elements = {
  getTrigger: () =>
    screen.getByRole("combobox", { name: "Filter by game", hidden: true }),
  getOption: (name: string) =>
    screen.getByRole("option", { name, hidden: true }),
  getOptionNames: () =>
    screen
      .getAllByRole("option", { hidden: true })
      .map((option) => option.textContent),
};

describe("JournalGameFilter", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    render(
      <JournalGameFilter
        options={options}
        value={undefined}
        onChange={onChange}
      />
    );
    await userEvent.click(elements.getTrigger());
  });

  it("offers All, each game with notes, then No game", () => {
    expect(elements.getOptionNames()).toEqual([
      "All",
      "Celeste",
      "Hollow Knight",
      "No game",
    ]);
  });

  it("reports the game id when a game is picked", async () => {
    await userEvent.click(elements.getOption("Hollow Knight"));
    expect(onChange).toHaveBeenCalledWith("game-2");
  });

  it("reports none when No game is picked", async () => {
    await userEvent.click(elements.getOption("No game"));
    expect(onChange).toHaveBeenCalledWith("none");
  });
});

function StatefulFilter() {
  const [value, setValue] = React.useState<string | undefined>(undefined);
  return (
    <JournalGameFilter
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("JournalGameFilter selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    render(<StatefulFilter />);
  });

  it("shows All before any game is picked, not a blank trigger", () => {
    expect(elements.getTrigger()).toHaveTextContent("All");
  });

  it("shows All as a chosen value, not as a placeholder", () => {
    expect(elements.getTrigger()).not.toHaveAttribute("data-placeholder");
  });

  describe("given a game is picked", () => {
    beforeEach(async () => {
      await userEvent.click(elements.getTrigger());
      await userEvent.click(elements.getOption("Hollow Knight"));
    });

    it("shows the game's title in the trigger, not its id", () => {
      expect(elements.getTrigger()).toHaveTextContent("Hollow Knight");
      expect(elements.getTrigger()).not.toHaveTextContent("game-2");
    });

    describe("and All is picked", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getTrigger());
        await userEvent.click(elements.getOption("All"));
      });

      it("clears the filter and the trigger shows All again", () => {
        expect(onChange).toHaveBeenLastCalledWith(undefined);
        expect(elements.getTrigger()).toHaveTextContent("All");
        expect(elements.getTrigger()).not.toHaveAttribute("data-placeholder");
      });
    });
  });
});
