import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getJournalGameOptionsFn,
  getJournalTimelinePageDataFn,
} from "@/features/journal-timeline";

import { Route } from "./journal.index";

type RouteHooks = { useLoaderData: () => unknown; useSearch: () => unknown };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
    useSearch: vi.fn(),
  }),
}));

vi.mock("@/features/journal-timeline", () => ({
  getJournalTimelinePageDataFn: vi.fn(),
  getJournalGameOptionsFn: vi.fn(),
}));

vi.mock("@/widgets/journal-timeline-page", () => ({
  JournalTimelinePage: ({
    entries,
    selectedGame,
  }: {
    entries: { id: string; content: string }[];
    selectedGame: string | undefined;
  }) => (
    <div>
      <span data-testid="selected">{selectedGame ?? "all"}</span>
      {entries.map((entry) => (
        <p key={entry.id}>{entry.content}</p>
      ))}
    </div>
  ),
}));

type Loader = (args: { deps: { gameId: string | undefined } }) => Promise<{
  entries: unknown[];
  gameOptions: unknown[];
}>;

describe("/journal route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getJournalTimelinePageDataFn).mockResolvedValue([] as never);
    vi.mocked(getJournalGameOptionsFn).mockResolvedValue([] as never);
  });

  describe("the loader with no filter", () => {
    it("asks for every note", async () => {
      await (Route.options.loader as Loader)({ deps: { gameId: undefined } });

      expect(getJournalTimelinePageDataFn).toHaveBeenCalledWith({
        data: { gameId: undefined },
      });
    });
  });

  describe("the loader with a game filter", () => {
    it("asks for that game's notes", async () => {
      await (Route.options.loader as Loader)({ deps: { gameId: "game-1" } });

      expect(getJournalTimelinePageDataFn).toHaveBeenCalledWith({
        data: { gameId: "game-1" },
      });
    });
  });

  describe("the loader with the No game filter", () => {
    it("asks for notes without a game", async () => {
      await (Route.options.loader as Loader)({ deps: { gameId: "none" } });

      expect(getJournalTimelinePageDataFn).toHaveBeenCalledWith({
        data: { gameId: "none" },
      });
    });
  });

  describe("the filter and the Log form share the URL", () => {
    it("keeps the filter in gameId, not the Log form's game param", () => {
      const validate = Route.options.validateSearch as (
        input: unknown
      ) => unknown;

      expect(validate({ gameId: "none" })).toEqual({ gameId: "none" });
    });
  });

  describe("given the loader resolved", () => {
    beforeEach(() => {
      const hooks = Route as unknown as RouteHooks;
      hooks.useLoaderData = () => ({
        entries: [{ id: "n1", content: "A note" }],
        gameOptions: [],
      });
      hooks.useSearch = () => ({ gameId: "game-1" });
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("renders the notes with the selected filter", () => {
      expect(screen.getByText("A note")).toBeDefined();
      expect(screen.getByTestId("selected").textContent).toBe("game-1");
    });
  });
});
