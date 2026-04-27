import { render, screen } from "@testing-library/react";

import { LibraryItemStatus } from "@/shared/types/library";

import { GameDetailHero } from "./game-detail-hero";

vi.mock("next/dynamic", () => ({
  default: (fn: () => Promise<unknown>) => {
    fn();
    return () => null;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/features/manage-library-entry/server-actions", () => ({
  deleteLibraryItemAction: vi.fn(),
}));

vi.mock("./game-cover-image", () => ({
  GameCoverImage: ({ gameTitle }: { gameTitle: string }) => (
    <div data-testid="game-cover">{gameTitle}</div>
  ),
}));

vi.mock("./library-rating-control", () => ({
  LibraryRatingControl: () => <div data-testid="library-rating-control" />,
}));

vi.mock("./library-status-dropdown-pill", () => ({
  LibraryStatusDropdownPill: () => (
    <div data-testid="library-status-dropdown-pill" />
  ),
}));

vi.mock("./library-status-segmented", () => ({
  LibraryStatusSegmented: () => <div data-testid="library-status-segmented" />,
}));

vi.mock("../lib/feature-flags", () => ({
  LIBRARY_STATUS_INLINE_VARIANT: "dropdown-pill",
}));

const MINIMAL_GAME = {
  id: 1234,
  name: "Hollow Knight",
  cover: { image_id: "abc123" },
  slug: "hollow-knight",
};

const GAME_WITH_META = {
  ...MINIMAL_GAME,
  first_release_date: 1487894400,
  involved_companies: [
    {
      company: { name: "Team Cherry" },
      developer: true,
      publisher: false,
      id: 1,
    },
  ],
  platforms: [{ id: 6, name: "PC (Windows)" }],
};

describe("GameDetailHero", () => {
  describe("single h1 invariant", () => {
    it("renders exactly one h1", () => {
      render(
        <GameDetailHero game={MINIMAL_GAME} bannerUrl={null} userId={null} />
      );
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(
        screen.getByRole("heading", { level: 1, name: "Hollow Knight" })
      ).toBeInTheDocument();
    });
  });

  describe("meta eyebrow", () => {
    it("renders eyebrow with year and developer name", () => {
      render(
        <GameDetailHero game={GAME_WITH_META} bannerUrl={null} userId={null} />
      );

      const eyebrow = screen.getByLabelText("Release year and studio");
      expect(eyebrow).toHaveTextContent("2017");
      expect(eyebrow).toHaveTextContent("Team Cherry");
      expect(
        screen.getByRole("heading", { level: 1, name: "Hollow Knight" })
      ).toBeInTheDocument();
    });

    it("falls back to platform name when no involved_companies", () => {
      render(
        <GameDetailHero
          game={{
            ...MINIMAL_GAME,
            first_release_date: 1487894400,
            platforms: [{ id: 6, name: "PC (Windows)" }],
          }}
          bannerUrl={null}
          userId={null}
        />
      );

      const eyebrow = screen.getByLabelText("Release year and studio");
      expect(eyebrow).toHaveTextContent("2017");
      expect(eyebrow).toHaveTextContent("PC (Windows)");
    });

    it("renders only year when no studio or platform available", () => {
      render(
        <GameDetailHero
          game={{ ...MINIMAL_GAME, first_release_date: 1487894400 }}
          bannerUrl={null}
          userId={null}
        />
      );

      expect(
        screen.getByLabelText("Release year and studio")
      ).toHaveTextContent("2017");
    });

    it("does not render eyebrow when no release date or studio", () => {
      render(
        <GameDetailHero game={MINIMAL_GAME} bannerUrl={null} userId={null} />
      );

      expect(
        screen.queryByLabelText("Release year and studio")
      ).not.toBeInTheDocument();
    });
  });

  describe("status cluster", () => {
    it("renders status pill, rating control, and more button as siblings under one parent", () => {
      render(
        <GameDetailHero
          game={MINIMAL_GAME}
          bannerUrl={null}
          userId="user-1"
          userLibraryStatus={{
            mostRecent: {
              id: 42,
              status: LibraryItemStatus.PLAYING,
              rating: 8,
            },
            updatedAt: new Date(),
            allItems: [],
          }}
        />
      );

      const cluster = screen.getByTestId("status-cluster");

      expect(cluster).toContainElement(
        screen.getByTestId("library-status-dropdown-pill")
      );
      expect(cluster).toContainElement(
        screen.getByTestId("library-rating-control")
      );
      expect(cluster).toContainElement(
        screen.getByRole("button", { name: "More options" })
      );
    });
  });

  describe("tab strip", () => {
    it("always renders Overview tab", () => {
      render(
        <GameDetailHero game={MINIMAL_GAME} bannerUrl={null} userId={null} />
      );

      expect(
        screen.getByRole("link", { name: "Overview" })
      ).toBeInTheDocument();
    });

    it("renders all tabs when all sections are present", () => {
      render(
        <GameDetailHero
          game={MINIMAL_GAME}
          bannerUrl={null}
          userId={null}
          hasJournal
          hasPlaytime
          hasRelated
        />
      );

      expect(
        screen.getByRole("link", { name: "Overview" })
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Journal" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Playtime" })
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Related" })).toBeInTheDocument();
    });

    it("omits Journal, Playtime, Related tabs when sections are absent", () => {
      render(
        <GameDetailHero game={MINIMAL_GAME} bannerUrl={null} userId={null} />
      );

      expect(
        screen.queryByRole("link", { name: "Journal" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Playtime" })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Related" })
      ).not.toBeInTheDocument();
    });

    it("tab links point to the correct anchor IDs", () => {
      render(
        <GameDetailHero
          game={MINIMAL_GAME}
          bannerUrl={null}
          userId={null}
          hasJournal
          hasPlaytime
          hasRelated
        />
      );

      expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
        "href",
        "#overview"
      );
      expect(screen.getByRole("link", { name: "Journal" })).toHaveAttribute(
        "href",
        "#journal"
      );
      expect(screen.getByRole("link", { name: "Playtime" })).toHaveAttribute(
        "href",
        "#playtime"
      );
      expect(screen.getByRole("link", { name: "Related" })).toHaveAttribute(
        "href",
        "#related"
      );
    });
  });
});
