import { render, screen } from "@testing-library/react";

import { QuickLogHeroClient } from "./quick-log-hero-client";

vi.mock("@/features/journal", () => ({
  JournalQuickEntrySheet: ({
    isOpen,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => (isOpen ? <div data-testid="journal-sheet" /> : null),
}));

vi.mock("@/shared/components/game-cover-image", () => ({
  GameCoverImage: ({ gameTitle }: { gameTitle: string }) => (
    <div data-testid="game-cover" aria-label={gameTitle} />
  ),
}));

const PLAYING_GAMES = [
  {
    id: "game-1",
    title: "Elden Ring",
    slug: "elden-ring",
    coverImage: null,
    latestActivityAt: new Date("2025-01-10"),
  },
  {
    id: "game-2",
    title: "Hollow Knight",
    slug: "hollow-knight",
    coverImage: null,
    latestActivityAt: new Date("2025-01-09"),
  },
];

describe("QuickLogHeroClient", () => {
  describe("given playing games are present", () => {
    it("renders a primary Log Session button per game", () => {
      render(
        <QuickLogHeroClient username="nail" playingGames={PLAYING_GAMES} />
      );

      const buttons = screen.getAllByRole("button", { name: /log session/i });
      expect(buttons).toHaveLength(2);
    });

    it("renders Reflect as a link, not a button", () => {
      render(
        <QuickLogHeroClient username="nail" playingGames={PLAYING_GAMES} />
      );

      const reflectLinks = screen.getAllByRole("link", { name: /reflect/i });
      expect(reflectLinks).toHaveLength(2);
      expect(
        screen.queryByRole("button", { name: /reflect/i })
      ).not.toBeInTheDocument();
    });

    it("Reflect links point to /journal/new with correct gameId", () => {
      render(
        <QuickLogHeroClient username="nail" playingGames={PLAYING_GAMES} />
      );

      const reflectLinks = screen.getAllByRole("link", { name: /reflect/i });
      expect(reflectLinks[0]).toHaveAttribute(
        "href",
        "/journal/new?gameId=game-1"
      );
      expect(reflectLinks[1]).toHaveAttribute(
        "href",
        "/journal/new?gameId=game-2"
      );
    });

    it("does not render the empty-state CTA", () => {
      render(
        <QuickLogHeroClient username="nail" playingGames={PLAYING_GAMES} />
      );

      expect(
        screen.queryByRole("link", { name: /find a game to start/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("given no playing games", () => {
    it("renders the empty state CTA", () => {
      render(<QuickLogHeroClient username="nail" playingGames={[]} />);

      expect(
        screen.getByRole("link", { name: /find a game to start/i })
      ).toBeInTheDocument();
    });

    it("does not render any Log Session button", () => {
      render(<QuickLogHeroClient username="nail" playingGames={[]} />);

      expect(
        screen.queryByRole("button", { name: /log session/i })
      ).not.toBeInTheDocument();
    });

    it("does not render any Reflect link", () => {
      render(<QuickLogHeroClient username="nail" playingGames={[]} />);

      expect(
        screen.queryByRole("link", { name: /reflect/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("greeting", () => {
    it("includes the username in the heading", () => {
      render(<QuickLogHeroClient username="nail" playingGames={[]} />);

      expect(
        screen.getByRole("heading", { name: /what did you play, nail/i })
      ).toBeInTheDocument();
    });
  });
});
