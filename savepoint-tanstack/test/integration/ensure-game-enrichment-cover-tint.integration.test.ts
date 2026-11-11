import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ensureGameEnrichment } from "@/entities/game/api/ensure-game-enrichment.server";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import { createGame } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";
import { GREY_COVER_JPEG, RED_COVER_JPEG } from "../support/cover-jpegs.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);
const fetchMock = vi.fn<typeof fetch>();

const COVER_IMAGE_ID = "co1abc";
const RED_HUE = 28;
const HUE_TOLERANCE = 15;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("ensure-game-enrichment-cover-tint");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockResolvedValue([]);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  await db.prisma.game.deleteMany();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function coverServerSends(bytes: Buffer) {
  fetchMock.mockImplementation(
    async () =>
      new Response(new Uint8Array(bytes), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })
  );
}

async function reload(id: string) {
  return db.prisma.game.findUniqueOrThrow({ where: { id } });
}

describe(ensureGameEnrichment, () => {
  describe("given a game with a red cover that was never tinted", () => {
    it("stores the cover hue, chroma and the time it was computed", async () => {
      const game = await createGame(db.prisma, { coverImage: COVER_IMAGE_ID });
      coverServerSends(RED_COVER_JPEG);

      await ensureGameEnrichment(game);

      const stored = await reload(game.id);
      expect(Math.abs(stored.coverHue! - RED_HUE)).toBeLessThan(HUE_TOLERANCE);
      expect(stored.coverChroma).toBeGreaterThan(0.1);
      expect(stored.coverTintComputedAt).toBeInstanceOf(Date);
    });

    it("reads the small .jpg thumbnail of the cover", async () => {
      const game = await createGame(db.prisma, { coverImage: COVER_IMAGE_ID });
      coverServerSends(RED_COVER_JPEG);

      await ensureGameEnrichment(game);

      const requestedUrls = fetchMock.mock.calls.map(([input]) =>
        String(input)
      );
      expect(requestedUrls).toContain(
        `https://images.igdb.com/igdb/image/upload/t_thumb/${COVER_IMAGE_ID}.jpg`
      );
    });
  });

  describe("given a black-and-white cover", () => {
    it("marks the tint as computed with no hue so it is not fetched again", async () => {
      const game = await createGame(db.prisma, { coverImage: COVER_IMAGE_ID });
      coverServerSends(GREY_COVER_JPEG);

      await ensureGameEnrichment(game);

      expect(await reload(game.id)).toMatchObject({
        coverHue: null,
        coverChroma: null,
        coverTintComputedAt: expect.any(Date),
      });
    });
  });

  describe("given the cover image cannot be fetched", () => {
    it("does not throw and leaves the tint uncomputed so a later view retries", async () => {
      const game = await createGame(db.prisma, { coverImage: COVER_IMAGE_ID });
      fetchMock.mockRejectedValue(new Error("network down"));

      await expect(ensureGameEnrichment(game)).resolves.not.toThrow();

      expect(await reload(game.id)).toMatchObject({
        coverHue: null,
        coverTintComputedAt: null,
      });
    });

    it("treats an error status like a failed fetch", async () => {
      const game = await createGame(db.prisma, { coverImage: COVER_IMAGE_ID });
      fetchMock.mockResolvedValue(new Response("nope", { status: 404 }));

      await ensureGameEnrichment(game);

      expect((await reload(game.id)).coverTintComputedAt).toBeNull();
    });
  });

  describe("given a game whose tint was already computed", () => {
    it("does not fetch the cover again", async () => {
      const game = await createGame(db.prisma, {
        coverImage: COVER_IMAGE_ID,
        coverHue: 120,
        coverChroma: 0.12,
        coverTintComputedAt: new Date(),
      });
      coverServerSends(RED_COVER_JPEG);

      await ensureGameEnrichment(game);

      expect(fetchMock).not.toHaveBeenCalled();
      expect((await reload(game.id)).coverHue).toBe(120);
    });
  });

  describe("given a game with no cover image", () => {
    it("does not fetch anything and leaves the tint uncomputed", async () => {
      const game = await createGame(db.prisma, { coverImage: null });

      await ensureGameEnrichment(game);

      expect(fetchMock).not.toHaveBeenCalled();
      expect((await reload(game.id)).coverTintComputedAt).toBeNull();
    });
  });
});
