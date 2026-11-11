/**
 * Integration tests for the Game table shape after the HLTB columns are dropped.
 *
 * Contract: the legacy HowLongToBeat columns and their unique index are gone,
 * while the replacement times-to-beat and cover-tint columns remain.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;
let gameColumnNames: string[];
let gameIndexNames: string[];

beforeAll(async () => {
  db = await setupIsolatedDatabase("drop-hltb-game-columns");

  const columns = await db.prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Game'
  `;
  gameColumnNames = columns.map((column) => column.column_name);

  const indexes = await db.prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'Game'
  `;
  gameIndexNames = indexes.map((index) => index.indexname);
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

describe("given the migrated Game table", () => {
  describe("when listing its columns", () => {
    it.each(["mainStory", "mainExtra", "completionist", "hltbId"])(
      "no longer has the legacy %s column",
      (legacyColumn) => {
        expect(gameColumnNames).not.toContain(legacyColumn);
      }
    );

    it.each([
      "timeToCreditsSeconds",
      "timeToCompleteSeconds",
      "timesToBeatFetchedAt",
      "coverHue",
      "coverChroma",
      "coverTintComputedAt",
    ])("still has the %s column", (retainedColumn) => {
      expect(gameColumnNames).toContain(retainedColumn);
    });
  });

  describe("when listing its indexes", () => {
    it("no longer has the unique index on hltbId", () => {
      expect(gameIndexNames).not.toContain("Game_hltbId_key");
    });
  });
});
