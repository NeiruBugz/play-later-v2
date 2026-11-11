import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type { Game } from "../../../../../shared/lib/prisma/client";
import type { GameDetailData } from "../game-detail/game-detail.type";
import { GameHeader } from "./game-header";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ history: { back: vi.fn() } }),
  useCanGoBack: () => false,
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const EIGHT_AND_A_HALF_HOURS_IN_SECONDS = 8.5 * 3600;
const EVENING_MINUTES = 60;
const SIX_PLATFORMS = [
  "PlayStation 5",
  "PC (Microsoft Windows)",
  "Xbox Series X|S",
  "Nintendo Switch",
  "PlayStation 4",
];

const buildGame = (): Game => ({
  id: "game-1",
  igdbId: 1234,
  hltbId: null,
  title: "Skyline Run",
  description: null,
  coverImage: null,
  releaseDate: new Date("2025-03-10T00:00:00Z"),
  mainStory: null,
  mainExtra: null,
  completionist: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  steamAppId: null,
  slug: "skyline-run",
  franchiseId: null,
  timeToCreditsSeconds: null,
  timeToCompleteSeconds: null,
  timesToBeatFetchedAt: null,
  coverHue: null,
  coverChroma: null,
  coverTintComputedAt: null,
});

const buildData = (
  igdbOverrides: Partial<GameDetailsResponseItem> = {},
  dataOverrides: Partial<GameDetailData> = {}
): GameDetailData => ({
  game: buildGame(),
  igdbDetails: {
    id: 1234,
    name: "Skyline Run",
    slug: "skyline-run",
    first_release_date: 1741564800,
    genres: [{ id: 5, name: "Shooter" }],
    platforms: [
      { id: 167, name: "PlayStation 5" },
      { id: 6, name: "PC (Microsoft Windows)" },
      { id: 169, name: "Xbox Series X|S" },
    ],
    aggregated_rating: 87.4,
    ...igdbOverrides,
  },
  libraryEntry: null,
  notes: [],
  playtimeTotalMinutes: 0,
  playtimeSessionCount: 0,
  timeToCreditsSeconds: EIGHT_AND_A_HALF_HOURS_IN_SECONDS,
  timeToCompleteSeconds: null,
  coverTint: null,
  ...dataOverrides,
});

function renderHeader(data: GameDetailData) {
  return render(<GameHeader data={data} eveningMinutes={EVENING_MINUTES} />);
}

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { name: "Skyline Run", level: 1 }),
  getBack: () => screen.getByRole("link", { name: "Back" }),
  queryFact: (label: string) => screen.queryByText(label),
};

describe(GameHeader, () => {
  describe("given a game with a length, a critic score and three platforms", () => {
    it("shows the title", () => {
      renderHeader(buildData());

      expect(elements.getTitle()).toBeInTheDocument();
    });

    it("labels the key facts Length, Critics and On", () => {
      renderHeader(buildData());

      expect(screen.getByText("Length")).toBeInTheDocument();
      expect(screen.getByText("Critics")).toBeInTheDocument();
      expect(screen.getByText("On")).toBeInTheDocument();
    });

    it("reads the length in evenings", () => {
      renderHeader(buildData());

      expect(screen.getByText("About 8 evenings")).toBeInTheDocument();
    });

    it("rounds the critic score to a whole number", () => {
      renderHeader(buildData());

      expect(screen.getByText("87")).toBeInTheDocument();
    });

    it("lists the platforms abbreviated", () => {
      renderHeader(buildData());

      expect(screen.getByText("PS5 · PC · XSX")).toBeInTheDocument();
    });
  });

  describe("given five platforms", () => {
    it("shows the first three and counts the other two", () => {
      renderHeader(
        buildData({
          platforms: SIX_PLATFORMS.map((name, id) => ({ id, name })),
        })
      );

      expect(screen.getByText("PS5 · PC · XSX +2")).toBeInTheDocument();
    });
  });

  describe("given no critic score", () => {
    it("does not show a Critics fact", () => {
      renderHeader(buildData({ aggregated_rating: undefined }));

      expect(elements.queryFact("Critics")).not.toBeInTheDocument();
      expect(screen.getByText("Length")).toBeInTheDocument();
    });
  });

  describe("given no length yet", () => {
    it("does not show a Length fact", () => {
      renderHeader(buildData({}, { timeToCreditsSeconds: null }));

      expect(elements.queryFact("Length")).not.toBeInTheDocument();
    });
  });

  describe("given the developer is unknown", () => {
    it("reads the year and the first genre only", () => {
      renderHeader(buildData());

      expect(screen.getByText("2025 · Shooter")).toBeInTheDocument();
    });

    it("does not credit the publisher as the developer", () => {
      renderHeader(
        buildData({
          involved_companies: [
            {
              developer: false,
              publisher: true,
              company: { id: 9, name: "Big Publisher" },
            },
          ],
        })
      );

      expect(screen.getByText("2025 · Shooter")).toBeInTheDocument();
    });
  });

  describe("given a developer is credited", () => {
    it("reads the year, the developer and the first genre", () => {
      renderHeader(
        buildData({
          involved_companies: [
            {
              developer: false,
              publisher: true,
              company: { id: 9, name: "Big Publisher" },
            },
            {
              developer: true,
              publisher: false,
              company: { id: 10, name: "Small Studio" },
            },
          ],
        })
      );

      expect(
        screen.getByText("2025 · Small Studio · Shooter")
      ).toBeInTheDocument();
    });
  });

  describe("given the page was opened cold, with no history to go back to", () => {
    it("offers Back as a link to the library", () => {
      renderHeader(buildData());

      expect(elements.getBack()).toHaveAttribute("href", "/library");
    });
  });
});
