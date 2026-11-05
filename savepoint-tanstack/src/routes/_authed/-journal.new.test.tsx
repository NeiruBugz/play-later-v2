import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./journal.new";

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useSearch: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/widgets/global-action-host", () => ({
  LogFormHost: ({ gameSlug }: { gameSlug?: string }) => (
    <div data-testid="log-form">
      <span data-testid="game-slug">{gameSlug ?? "none"}</span>
    </div>
  ),
}));

function renderRoute(search: { game?: string }) {
  (Route as unknown as { useSearch: () => { game?: string } }).useSearch = () =>
    search;
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}

describe("/journal/new route", () => {
  it("renders the Log form with the game from the search param chosen", () => {
    renderRoute({ game: "celeste" });
    expect(screen.getByTestId("game-slug").textContent).toBe("celeste");
  });

  it("renders the Log form with no game chosen by default", () => {
    renderRoute({});
    expect(screen.getByTestId("game-slug").textContent).toBe("none");
  });

  it("renders the New note heading", () => {
    renderRoute({});
    expect(screen.getByRole("heading", { name: "New note" })).toBeDefined();
  });

  it("does not nest a main landmark inside the app shell", () => {
    renderRoute({});
    expect(screen.queryByRole("main")).toBeNull();
  });
});
