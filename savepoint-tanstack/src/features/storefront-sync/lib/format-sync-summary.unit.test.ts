/**
 * RED unit test for formatSyncSummary (spec 030 functional 2.5.1, tech 2.7).
 *
 * Contract:
 *   - `features/storefront-sync/lib/format-sync-summary.ts` exports
 *     `formatSyncSummary(status: SteamSyncStatus): string`.
 *   - Parts, in this order, each dropped when its count is 0:
 *       "{newGames} new game(s)"            "1 new game"        "12 new games"
 *       "{refreshedGames} already on your list"                 (no plural form)
 *       "{addedToLibrary} added to your library"  only when status.addAllToLibrary
 *       "{needsMatch} need(s) a match"      "1 needs a match"   "3 need a match"
 *   - Parts are joined with " · ".
 */
import { describe, expect, it } from "vitest";

import type { SteamSyncStatus } from "../model/types";
import { formatSyncSummary } from "./format-sync-summary";

const makeStatus = (overrides: Partial<SteamSyncStatus>): SteamSyncStatus => ({
  jobId: "job-1",
  status: "FINISHED",
  totalToLookUp: 0,
  lookedUp: 0,
  newGames: 0,
  refreshedGames: 0,
  addedToLibrary: 0,
  needsMatch: 0,
  addAllToLibrary: false,
  failureCode: null,
  finishedAt: new Date("2026-11-14T12:00:00.000Z"),
  noticeSeen: false,
  ...overrides,
});

describe("formatSyncSummary", () => {
  describe.each([
    {
      given: "every part has something to say",
      status: {
        newGames: 12,
        refreshedGames: 340,
        addAllToLibrary: true,
        addedToLibrary: 9,
        needsMatch: 3,
      },
      summary:
        "12 new games · 340 already on your list · 9 added to your library · 3 need a match",
    },
    {
      given: "add-all was off",
      status: { newGames: 12, refreshedGames: 340, needsMatch: 3 },
      summary: "12 new games · 340 already on your list · 3 need a match",
    },
    {
      given: "no game is new",
      status: { newGames: 0, refreshedGames: 340, needsMatch: 3 },
      summary: "340 already on your list · 3 need a match",
    },
    {
      given: "nothing was already on the list",
      status: { newGames: 12, refreshedGames: 0, needsMatch: 3 },
      summary: "12 new games · 3 need a match",
    },
    {
      given: "no game needs a match",
      status: { newGames: 12, refreshedGames: 340, needsMatch: 0 },
      summary: "12 new games · 340 already on your list",
    },
    {
      given: "only one part is left",
      status: { newGames: 0, refreshedGames: 7, needsMatch: 0 },
      summary: "7 already on your list",
    },
  ])("given $given", ({ status, summary }) => {
    it(`reads "${summary}"`, () => {
      expect(formatSyncSummary(makeStatus(status))).toBe(summary);
    });
  });

  describe.each([
    {
      given: "a single new game and nothing needing a match",
      status: { newGames: 1 },
      summary: "1 new game",
    },
    {
      given: "a single game already on the list",
      status: { refreshedGames: 1 },
      summary: "1 already on your list",
    },
    {
      given: "a single game added to the library",
      status: { addAllToLibrary: true, addedToLibrary: 1 },
      summary: "1 added to your library",
    },
    {
      given: "a single game needing a match",
      status: { needsMatch: 1 },
      summary: "1 needs a match",
    },
    {
      given: "one of each",
      status: {
        newGames: 1,
        refreshedGames: 1,
        addAllToLibrary: true,
        addedToLibrary: 1,
        needsMatch: 1,
      },
      summary:
        "1 new game · 1 already on your list · 1 added to your library · 1 needs a match",
    },
  ])("given $given", ({ status, summary }) => {
    it(`uses the singular: "${summary}"`, () => {
      expect(formatSyncSummary(makeStatus(status))).toBe(summary);
    });
  });

  describe("given add-all was off but the job somehow counted added games", () => {
    it("does not mention the library at all", () => {
      expect(
        formatSyncSummary(
          makeStatus({
            newGames: 4,
            addAllToLibrary: false,
            addedToLibrary: 4,
          })
        )
      ).toBe("4 new games");
    });
  });

  describe("given add-all was on but no game was added", () => {
    it("leaves the added part out", () => {
      expect(
        formatSyncSummary(
          makeStatus({
            newGames: 2,
            addAllToLibrary: true,
            addedToLibrary: 0,
            needsMatch: 2,
          })
        )
      ).toBe("2 new games · 2 need a match");
    });
  });
});
