import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
