import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JournalTimelineEntry } from "@/entities/journal-entry/model/types";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./journal.$id";

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

vi.mock("@/widgets/journal-entry-page", () => ({
  JournalEntryPage: ({ entry }: { entry: { id: string; content: string } }) => (
    <div data-testid="journal-entry-page">
      <span data-testid="entry-id">{entry.id}</span>
      <p>{entry.content}</p>
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
    content: "Loaded content",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    gameId: "game-1",
    game: { id: "game-1", title: "Game", slug: "game", coverImage: null },
    ...overrides,
  } as JournalTimelineEntry;
}

const elements = {
  getPage: () => screen.getByTestId("journal-entry-page"),
  getEntryId: () => screen.getByTestId("entry-id"),
  getNotFoundHeading: () =>
    screen.getByRole("heading", { name: "Entry not found" }),
  getGenericHeading: () =>
    screen.getByRole("heading", { name: "Something went wrong" }),
};

function renderComponent(entry: JournalTimelineEntry) {
  (
    Route as unknown as { useLoaderData: () => JournalTimelineEntry }
  ).useLoaderData = () => entry;
  const Component = Route.options.component as ComponentType;
  render(<Component />);
}

function renderError(error: Error) {
  const ErrorComponent = Route.options.errorComponent as ComponentType<{
    error: Error;
  }>;
  render(<ErrorComponent error={error} />);
}

describe("/journal/$id route", () => {
  describe("given the loader resolves with an entry", () => {
    beforeEach(() => {
      renderComponent(buildEntry({ id: "entry-42", content: "Hello world" }));
    });

    it("renders the journal entry page with the loaded entry", () => {
      expect(elements.getPage()).toBeDefined();
      expect(elements.getEntryId().textContent).toBe("entry-42");
      expect(screen.getByText("Hello world")).toBeDefined();
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

      await loader({ params: { id: "entry-77" } });

      expect(vi.mocked(api.getJournalEntryPageDataFn)).toHaveBeenCalledWith({
        data: { entryId: "entry-77" },
      });
    });
  });

  describe("given a NotFoundError reaches the error component", () => {
    beforeEach(() => {
      renderError(new NotFoundError("Journal entry not found"));
    });

    it("renders the 404 surface", () => {
      expect(elements.getNotFoundHeading()).toBeDefined();
    });
  });

  describe("given a non-NotFound error reaches the error component", () => {
    beforeEach(() => {
      renderError(new Error("boom"));
    });

    it("renders the generic error surface", () => {
      expect(elements.getGenericHeading()).toBeDefined();
    });
  });
});
