import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardQuickLogGame } from "@/features/dashboard";

import { DashboardJumpBackInHero } from "./dashboard-jump-back-in-hero";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, params, children, ...rest }: any) => {
    delete rest.search;
    const href =
      typeof to === "string"
        ? params?.slug
          ? `${to.replace("$slug", params.slug)}`
          : to
        : "#";
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
  useNavigate: () => mockNavigate,
}));

vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
}));

function makeGame(
  overrides: Partial<DashboardQuickLogGame> = {}
): DashboardQuickLogGame {
  return {
    id: "game-1",
    igdbId: 1234,
    title: "Elden Ring",
    slug: "elden-ring",
    coverImage: "abc123",
    ...overrides,
  };
}

const elements = {
  getSection: () => screen.getByRole("region", { name: "Jump back in" }),
  getGreeting: (username: string) =>
    screen.getByText(new RegExp(username, "i")),
  getGameTitle: (title: string) => screen.getByText(title),
  queryGameTitle: (title: string) => screen.queryByText(title),
  getCoverImage: (title: string) =>
    screen.getByRole("img", { name: `Cover for ${title}` }),
  getLogButton: () => screen.getByRole("button", { name: "Log session" }),
  queryLogButton: () => screen.queryByRole("button", { name: "Log session" }),
  getEmptyMessage: () => screen.getByText(/nothing in progress/i),
};

const actions = {
  clickLog: async () => userEvent.click(elements.getLogButton()),
};

describe("DashboardJumpBackInHero", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given the player has an in-progress game", () => {
    const game = makeGame();

    beforeEach(() => {
      render(
        <DashboardJumpBackInHero username="Ada" mostInProgressGame={game} />
      );
    });

    it("renders the jump-back-in region with its accessible label", () => {
      expect(elements.getSection()).toBeDefined();
    });

    it("renders a greeting eyebrow that includes the username", () => {
      expect(elements.getGreeting("Ada")).toBeDefined();
    });

    it("renders the game title in the hero card", () => {
      expect(elements.getGameTitle("Elden Ring")).toBeDefined();
    });

    it("renders the cover image with the correct alt text", () => {
      expect(elements.getCoverImage("Elden Ring")).toBeDefined();
    });

    it("renders a Log session button", () => {
      expect(elements.getLogButton()).toBeDefined();
    });

    it("does not render the empty-state message when a game is present", () => {
      expect(elements.queryGameTitle("Nothing in progress")).toBeNull();
    });
  });

  describe("given the user clicks the Log session button", () => {
    const game = makeGame({ slug: "elden-ring" });

    beforeEach(async () => {
      render(
        <DashboardJumpBackInHero username="Ada" mostInProgressGame={game} />
      );
      await actions.clickLog();
    });

    it("calls navigate with a search updater function", () => {
      expect(mockNavigate).toHaveBeenCalledOnce();
      const [callArg] = mockNavigate.mock.calls[0];
      expect(typeof callArg.search).toBe("function");
    });

    it("the search updater sets action=log-session", () => {
      const [callArg] = mockNavigate.mock.calls[0];
      const result = callArg.search({});
      expect(result).toMatchObject({ action: "log-session" });
    });

    it("the search updater sets game to the game slug", () => {
      const [callArg] = mockNavigate.mock.calls[0];
      const result = callArg.search({});
      expect(result).toMatchObject({ game: "elden-ring" });
    });

    it("the search updater preserves existing search params", () => {
      const [callArg] = mockNavigate.mock.calls[0];
      const result = callArg.search({ page: 2 });
      expect(result).toMatchObject({
        page: 2,
        action: "log-session",
        game: "elden-ring",
      });
    });
  });

  describe("given the player has no in-progress game", () => {
    beforeEach(() => {
      render(
        <DashboardJumpBackInHero username="Ada" mostInProgressGame={null} />
      );
    });

    it("renders an empty-state message instead of a Log button", () => {
      expect(elements.getEmptyMessage()).toBeDefined();
      expect(elements.queryLogButton()).toBeNull();
    });
  });
});
