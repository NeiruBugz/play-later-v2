import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./journal.$id.edit";

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/features/journal-timeline", () => ({
  getJournalEntryPageDataFn: vi.fn(),
}));

vi.mock("@/features/edit-journal-entry", () => ({
  EditJournalEntryForm: ({
    entry,
  }: {
    entry: { id: string; content: string; gameId: string | null };
  }) => (
    <div data-testid="edit-form">
      <span data-testid="entry-id">{entry.id}</span>
      <span data-testid="entry-content">{entry.content}</span>
      <span data-testid="entry-game-id">{entry.gameId ?? "null"}</span>
    </div>
  ),
}));

function buildEntry(
  overrides: Partial<JournalTimelineEntry> = {}
): JournalTimelineEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    kind: "QUICK",
    title: null,
    content: "Edit me",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    gameId: "game-1",
    game: { id: "game-1", title: "Game", slug: "game", coverImage: null },
    ...overrides,
  } as JournalTimelineEntry;
}

const elements = {
  getForm: () => screen.getByTestId("edit-form"),
  getEntryId: () => screen.getByTestId("entry-id"),
  getEntryContent: () => screen.getByTestId("entry-content"),
  getEntryGameId: () => screen.getByTestId("entry-game-id"),
  getNotFoundHeading: () =>
    screen.getByRole("heading", { name: "Entry not found" }),
};

function renderComponent(entry: JournalTimelineEntry) {
  (
    Route as unknown as { useLoaderData: () => JournalTimelineEntry }
  ).useLoaderData = () => entry;
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}

describe("/journal/$id/edit route", () => {
  describe("given the loader resolves with an entry", () => {
    beforeEach(() => {
      renderComponent(
        buildEntry({
          id: "entry-9",
          content: "Pre-fill",
          gameId: "game-9",
          game: {
            id: "game-9",
            title: "Game",
            slug: "game",
            coverImage: null,
          },
        })
      );
    });

    it("renders the edit form pre-filled from the loaded entry", () => {
      expect(elements.getForm()).toBeDefined();
      expect(elements.getEntryId().textContent).toBe("entry-9");
      expect(elements.getEntryContent().textContent).toBe("Pre-fill");
      expect(elements.getEntryGameId().textContent).toBe("game-9");
    });
  });

  describe("the loader", () => {
    it("calls getJournalEntryPageDataFn with the route id param", async () => {
      const api = await import("@/features/journal-timeline");
      vi.mocked(api.getJournalEntryPageDataFn).mockResolvedValue(
        buildEntry() as never
      );
      const loader = Route.options.loader as (args: {
        params: { id: string };
      }) => unknown;

      await loader({ params: { id: "entry-88" } });

      expect(vi.mocked(api.getJournalEntryPageDataFn)).toHaveBeenCalledWith({
        data: { entryId: "entry-88" },
      });
    });
  });

  describe("given a NotFoundError reaches the error component", () => {
    beforeEach(() => {
      const ErrorComponent = Route.options.errorComponent as ComponentType<{
        error: Error;
      }>;
      render(<ErrorComponent error={new NotFoundError("not found")} />);
    });

    it("renders the 404 surface", () => {
      expect(elements.getNotFoundHeading()).toBeDefined();
    });
  });
});
