import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailPageView } from "@/features/game-detail/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./games.$slug";

vi.mock("@/features/game-detail/api", () => ({
  getGameDetailPageDataFn: vi.fn(),
}));

vi.mock("@/widgets/game-detail", () => ({
  GameDetail: ({
    data,
    viewerUserId,
  }: {
    data: GameDetailPageView["data"];
    viewerUserId: string | null;
  }) => (
    <div data-testid="game-detail">
      <h1>{data.game.title}</h1>
      <span data-testid="viewer-user-id">{viewerUserId ?? "anon"}</span>
      <span data-testid="journal-count">{data.journalTeaser.length}</span>
    </div>
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const buildView = (
  overrides: Partial<GameDetailPageView> = {}
): GameDetailPageView => ({
  data: {
    game: {
      id: "g1",
      slug: "celeste",
      title: "Celeste",
      coverImage: null,
      releaseDate: null,
      description: null,
    } as unknown as GameDetailPageView["data"]["game"],
    relatedGames: [],
    libraryEntry: null,
    journalTeaser: [],
  },
  viewerUserId: null,
  ...overrides,
});

const elements = {
  getDetail: () => screen.getByTestId("game-detail"),
  queryDetail: () => screen.queryByTestId("game-detail"),
  getViewerId: () => screen.getByTestId("viewer-user-id"),
  getNotFoundHeading: () =>
    screen.getByRole("heading", { name: "Game not found" }),
  getGenericErrorHeading: () =>
    screen.getByRole("heading", { name: "Something went wrong" }),
  getHomeLink: () => screen.getByRole("link", { name: "Go home" }),
  queryNotFoundHeading: () =>
    screen.queryByRole("heading", { name: "Game not found" }),
};

describe("/games/$slug route", () => {
  describe("given the loader resolves with signed-in viewer data", () => {
    const view = buildView({ viewerUserId: "user-123" });

    beforeEach(() => {
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("renders the game detail widget with the loaded data", () => {
      expect(elements.getDetail()).toBeDefined();
      expect(screen.getByText("Celeste")).toBeDefined();
    });

    it("forwards the resolved viewerUserId to the widget", () => {
      expect(elements.getViewerId().textContent).toBe("user-123");
    });
  });

  describe("given the loader resolves with anonymous viewer data", () => {
    const view = buildView({ viewerUserId: null });

    beforeEach(() => {
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("forwards null viewerUserId so the widget hides the journal teaser", () => {
      expect(elements.getViewerId().textContent).toBe("anon");
    });
  });

  describe("given the loader throws NotFoundError", () => {
    beforeEach(() => {
      const ErrorComponent = Route.options.errorComponent as ComponentType<{
        error: Error;
      }>;
      render(
        <ErrorComponent error={new NotFoundError("Game not found")} />
      );
    });

    it("renders the friendly 404 surface", () => {
      expect(elements.getNotFoundHeading()).toBeDefined();
    });

    it("renders a link back home", () => {
      expect(elements.getHomeLink()).toHaveAttribute("href", "/");
    });
  });

  describe("given the loader throws a non-NotFound error", () => {
    beforeEach(() => {
      const ErrorComponent = Route.options.errorComponent as ComponentType<{
        error: Error;
      }>;
      render(<ErrorComponent error={new Error("boom")} />);
    });

    it("renders the generic error surface", () => {
      expect(elements.getGenericErrorHeading()).toBeDefined();
    });

    it("does not render the 404 heading", () => {
      expect(elements.queryNotFoundHeading()).toBeNull();
    });
  });

  describe("loader wiring", () => {
    it("calls getGameDetailPageDataFn with the slug from params", async () => {
      const { getGameDetailPageDataFn } = await import(
        "@/features/game-detail/api"
      );
      vi.mocked(getGameDetailPageDataFn).mockResolvedValue(buildView());

      const loader = Route.options.loader as (args: {
        params: { slug: string };
      }) => Promise<unknown>;
      await loader({ params: { slug: "celeste" } });

      expect(getGameDetailPageDataFn).toHaveBeenCalledWith({
        data: { slug: "celeste" },
      });
    });
  });
});
