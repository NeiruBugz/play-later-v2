import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddGameContent } from "./add-game-content";

const { searchGamesFnMock } = vi.hoisted(() => ({
  searchGamesFnMock: vi.fn(),
}));

vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: searchGamesFnMock,
}));
vi.mock("../quick-add-button", () => ({
  QuickAddButton: () => <button type="button">Add</button>,
}));

const game = (
  id: number,
  name: string,
  library: { status: string; upNextPosition: number | null } | null
) => ({ id, name, slug: name.toLowerCase(), library });

describe("AddGameContent", () => {
  beforeEach(async () => {
    searchGamesFnMock.mockResolvedValue({
      count: 3,
      games: [
        game(1, "Hades", { status: "WANT", upNextPosition: 2 }),
        game(2, "Celeste", { status: "DONE", upNextPosition: 1 }),
        game(3, "Tunic", null),
      ],
    });
    render(<AddGameContent onAdded={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Search games"), "game{Enter}");
  });

  it("marks queued results 'Up Next #2' and 'Replay'", async () => {
    expect(await screen.findByText("Up Next #2")).toBeDefined();
    expect(screen.getByText("Replay")).toBeDefined();
  });

  it("marks nothing on a result that is not in the library", async () => {
    await screen.findByText("Tunic");
    expect(screen.getAllByTestId("queue-marker")).toHaveLength(2);
  });
});
