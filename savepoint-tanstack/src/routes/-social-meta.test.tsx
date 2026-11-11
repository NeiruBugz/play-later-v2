import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route as GameRoute } from "./games.$slug";
import { Route as LandingRoute } from "./index";

vi.mock("@/features/game-detail/api", () => ({
  getGameDetailPageDataFn: vi.fn(),
}));

vi.mock("@/features/browse-related-games/api", () => ({
  getRelatedCollectionsFn: vi.fn(),
}));

vi.mock("@/widgets/game-detail", () => ({ GameDetail: () => null }));
vi.mock("@/widgets/landing-hero", () => ({ LandingHero: () => null }));
vi.mock("@/widgets/landing-features", () => ({
  LandingFeaturesStrip: () => null,
  LandingPreviewCard: () => null,
}));
vi.mock("@/features/browse-related-games", () => ({
  RelatedGamesSkeleton: () => null,
  RelatedGamesStrip: () => null,
}));

const siteOrigin = "https://example.test";

type MetaEntry = { name?: string; property?: string; content?: string };

function metaContent(meta: MetaEntry[], key: string) {
  return meta.find((entry) => (entry.property ?? entry.name) === key)?.content;
}

function titleOf(meta: Array<MetaEntry & { title?: string }>) {
  return meta.find((entry) => entry.title !== undefined)?.title;
}

describe("landing head", () => {
  describe("given the site origin is https://example.test", () => {
    let meta: MetaEntry[];

    beforeEach(() => {
      meta = (LandingRoute.options.head as any)({
        match: { context: { siteOrigin } },
      }).meta;
    });

    it("titles the page with the product name alone", () => {
      expect(titleOf(meta)).toBe("Continue?");
    });

    it("points og:url at the origin root", () => {
      expect(metaContent(meta, "og:url")).toBe("https://example.test/");
    });

    it("serves the preview image from the same origin for og and twitter", () => {
      expect([
        metaContent(meta, "og:image"),
        metaContent(meta, "twitter:image"),
      ]).toEqual([
        "https://example.test/og-image.png",
        "https://example.test/og-image.png",
      ]);
    });
  });
});

describe("game page head", () => {
  describe("given the game Hades at /games/hades", () => {
    let meta: MetaEntry[];

    beforeEach(() => {
      meta = (GameRoute.options.head as any)({
        match: { context: { siteOrigin }, pathname: "/games/hades" },
        loaderData: { data: { game: { title: "Hades" } } },
      }).meta;
    });

    it("titles the page with the game before the product name", () => {
      expect(titleOf(meta)).toBe("Hades · Continue?");
    });

    it("points og:url at the game page on the site origin", () => {
      expect(metaContent(meta, "og:url")).toBe(
        "https://example.test/games/hades"
      );
    });

    it("serves the preview image from the same origin for og and twitter", () => {
      expect([
        metaContent(meta, "og:image"),
        metaContent(meta, "twitter:image"),
      ]).toEqual([
        "https://example.test/og-image.png",
        "https://example.test/og-image.png",
      ]);
    });
  });

  describe("given the game has not loaded", () => {
    it("falls back to the product name as title", () => {
      const { meta } = (GameRoute.options.head as any)({
        match: { context: { siteOrigin }, pathname: "/games/hades" },
        loaderData: undefined,
      });
      expect(titleOf(meta)).toBe("Continue?");
    });
  });
});
