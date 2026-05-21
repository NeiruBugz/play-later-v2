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
}));

vi.mock("@/features/compose-journal-entry", () => ({
  ComposeJournalEntryForm: ({
    defaultGameId,
  }: {
    defaultGameId?: string | null;
  }) => (
    <div data-testid="compose-form">
      <span data-testid="default-game-id">{defaultGameId ?? "null"}</span>
    </div>
  ),
}));

function renderRoute(search: { gameId?: string }) {
  (Route as unknown as { useSearch: () => { gameId?: string } }).useSearch =
    () => search;
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}

describe("/journal/new route", () => {
  describe("given a gameId search param", () => {
    it("forwards the gameId to the compose form", () => {
      renderRoute({ gameId: "game-99" });
      expect(screen.getByTestId("default-game-id").textContent).toBe("game-99");
    });
  });

  describe("given no gameId search param", () => {
    it("forwards a null game association", () => {
      renderRoute({});
      expect(screen.getByTestId("default-game-id").textContent).toBe("null");
    });

    it("renders the page heading", () => {
      renderRoute({});
      expect(
        screen.getByRole("heading", { name: "Write New Entry" })
      ).toBeDefined();
    });
  });
});
