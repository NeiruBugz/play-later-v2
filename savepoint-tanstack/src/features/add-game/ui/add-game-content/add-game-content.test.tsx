import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddGameContent } from "./add-game-content";

const { searchGamesFnMock, addGameFnMock } = vi.hoisted(() => ({
  searchGamesFnMock: vi.fn(),
  addGameFnMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({
    to,
    params,
    search,
    children,
    ...rest
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    children: React.ReactNode;
  }) => {
    let href = to;
    for (const [key, value] of Object.entries(params ?? {})) {
      href = href.replace(`$${key}`, value);
    }
    if (search) href += `?${new URLSearchParams(search).toString()}`;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: searchGamesFnMock,
}));
vi.mock("../../api/add-game-fn", () => ({ addGameFn: addGameFnMock }));
vi.mock("../../api/undo-add-game-fn", () => ({ undoAddGameFn: vi.fn() }));

const game = (
  id: number,
  name: string,
  library: { status: string; upNextPosition: number | null } | null
) => ({ id, name, slug: name.toLowerCase(), library });

describe("AddGameContent", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    searchGamesFnMock.mockResolvedValue({
      count: 3,
      games: [
        game(1, "Hades", { status: "WANT", upNextPosition: 2 }),
        game(2, "Celeste", { status: "DONE", upNextPosition: 1 }),
        game(3, "Tunic", null),
      ],
    });
    addGameFnMock.mockResolvedValue({
      libraryItemId: 3,
      created: true,
      status: "WANT",
      upNextPosition: null,
    });
    render(<AddGameContent />);
    await userEvent.type(screen.getByLabelText("Search games"), "game");
  });

  it("searches as the user types, without pressing Enter", async () => {
    expect(await screen.findByText("Tunic")).toBeDefined();
    expect(searchGamesFnMock).toHaveBeenCalledWith({ data: { name: "game" } });
  });

  it("marks queued results 'Up Next #2' and 'Replay'", async () => {
    expect(await screen.findByText("Up Next #2")).toBeDefined();
    expect(screen.getByText("Replay")).toBeDefined();
  });

  it("offers no add button for games already in the library", async () => {
    await screen.findByText("Tunic");
    expect(screen.queryByRole("button", { name: "Add Hades" })).toBeNull();
    expect(screen.getAllByText("In library")).toHaveLength(2);
  });

  it("links 'See all results' to the search page with the same text", async () => {
    const link = await screen.findByRole("link", { name: "See all results" });
    expect(link).toHaveAttribute("href", "/games/search?q=game");
  });

  it("stays open after adding so another game can be added", async () => {
    await userEvent.click(
      await screen.findByRole("button", { name: "Add Tunic" })
    );
    expect(await screen.findAllByText("In library")).toHaveLength(3);
    expect(screen.getByLabelText("Search games")).toBeDefined();
  });

  it("never shows the technical source name", async () => {
    await screen.findByText("Tunic");
    expect(document.body.textContent).not.toContain("IGDB");
  });
});
