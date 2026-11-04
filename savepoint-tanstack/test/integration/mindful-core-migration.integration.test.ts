/**
 * Integration test for spec 026 migration A (`20261104120000_mindful_core_model`).
 *
 * Approach: build a pre-026 database by executing every earlier migration.sql in
 * order, seed legacy-shaped rows with raw SQL, then read and execute the REAL
 * migration A file from disk and assert the resulting data.
 */

import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION_A = "20261104120000_mindful_core_model";
const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../prisma/migrations"
);
const DOCKER_CONTAINER = "savepoint-postgres";
const DB_PREFIX = "savepoint_tanstack_test_";

interface LegacyDatabase {
  client: Client;
  teardown(): Promise<void>;
}

function docker(command: string) {
  execSync(`docker exec ${DOCKER_CONTAINER} ${command}`, { stdio: "ignore" });
}

function migrationSql(name: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
}

async function createLegacyDatabase(key: string): Promise<LegacyDatabase> {
  const dbName = `${DB_PREFIX}${key}`;
  docker(`dropdb --if-exists -U postgres ${dbName}`);
  docker(`createdb -U postgres ${dbName}`);

  const client = new Client({
    connectionString: `postgresql://postgres:postgres@localhost:6432/${dbName}`,
  });
  await client.connect();

  const earlier = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name < MIGRATION_A)
    .map((entry) => entry.name)
    .sort();
  for (const name of earlier) {
    await client.query(migrationSql(name));
  }

  return {
    client,
    async teardown() {
      await client.end();
      try {
        docker(`dropdb --if-exists -U postgres ${dbName}`);
      } catch {
        /* best-effort */
      }
    },
  };
}

interface ItemSeed {
  user: string;
  key: string;
  status: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
  hasBeenPlayed?: boolean;
  statusIsManual?: boolean;
  rating?: number;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
}

interface RunSeed {
  key: string;
  ordinal: number;
  status: "PLAYING" | "FINISHED" | "ABANDONED";
  finishedAt?: string | null;
  playtimeMinutes?: number;
  rating?: number;
  updatedAt?: string;
}

class Seeder {
  private gameCount = 0;
  private itemIds = new Map<string, number>();
  private runIds = new Map<string, string>();

  constructor(private readonly client: Client) {}

  async user(id: string) {
    await this.client.query(
      `INSERT INTO "user" ("id", "updatedAt") VALUES ($1, NOW())`,
      [id]
    );
  }

  async item(seed: ItemSeed) {
    const gameId = `game-${seed.key}`;
    this.gameCount += 1;
    await this.client.query(
      `INSERT INTO "Game" ("id", "igdbId", "title", "slug", "updatedAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [gameId, 1000 + this.gameCount, seed.key, `slug-${seed.key}`]
    );
    const { rows } = await this.client.query<{ id: number }>(
      `INSERT INTO "LibraryItem"
         ("userId", "gameId", "status", "hasBeenPlayed", "statusIsManual", "rating",
          "startedAt", "completedAt", "updatedAt")
       VALUES ($1, $2, $3::"LibraryItemStatus", $4, $5, $6, $7, $8, COALESCE($9::timestamp, NOW()))
       RETURNING id`,
      [
        seed.user,
        gameId,
        seed.status,
        seed.hasBeenPlayed ?? false,
        seed.statusIsManual ?? false,
        seed.rating ?? null,
        seed.startedAt ?? null,
        seed.completedAt ?? null,
        seed.updatedAt ?? null,
      ]
    );
    this.itemIds.set(seed.key, rows[0].id);
  }

  itemId(key: string): number {
    const id = this.itemIds.get(key);
    if (id === undefined) throw new Error(`unknown item ${key}`);
    return id;
  }

  async run(run: RunSeed) {
    const id = `run-${run.key}-${run.ordinal}`;
    await this.client.query(
      `INSERT INTO "Playthrough"
         ("id", "libraryItemId", "ordinal", "kind", "status", "finishedAt",
          "playtimeMinutes", "rating", "updatedAt")
       VALUES ($1, $2, $3, 'REPLAY', $4::"PlaythroughStatus", $5, $6, $7,
               COALESCE($8::timestamp, NOW()))`,
      [
        id,
        this.itemId(run.key),
        run.ordinal,
        run.status,
        run.finishedAt ?? null,
        run.playtimeMinutes ?? 0,
        run.rating ?? null,
        run.updatedAt ?? null,
      ]
    );
    this.runIds.set(`${run.key}:${run.ordinal}`, id);
  }

  async note(
    key: string,
    userId: string,
    minutes: number,
    runOrdinal?: number
  ) {
    await this.client.query(
      `INSERT INTO "JournalEntry"
         ("id", "content", "userId", "gameId", "libraryItemId", "playthroughId",
          "playedMinutes", "updatedAt")
       VALUES ($1, 'note', $2, $3, $4, $5, $6, NOW())`,
      [
        `note-${key}-${minutes}-${runOrdinal ?? "x"}`,
        userId,
        `game-${key}`,
        this.itemId(key),
        runOrdinal === undefined
          ? null
          : this.runIds.get(`${key}:${runOrdinal}`),
        minutes,
      ]
    );
  }
}

const DAY = (n: number) => `2026-03-${String(n).padStart(2, "0")}T10:00:00Z`;

async function seedLegacyData(client: Client) {
  const s = new Seeder(client);
  await s.user("u1");
  await s.user("u2");
  await s.user("u3");

  // Spec 2.12 rows
  await s.item({ user: "u1", key: "wishlist", status: "WISHLIST" });
  await s.item({ user: "u1", key: "shelf", status: "SHELF" });
  await s.item({
    user: "u1",
    key: "upnext-fresh",
    status: "UP_NEXT",
    updatedAt: DAY(20),
  });
  await s.item({
    user: "u1",
    key: "upnext-played",
    status: "UP_NEXT",
    hasBeenPlayed: true,
    updatedAt: DAY(21),
  });
  await s.item({
    user: "u1",
    key: "upnext-run-ended",
    status: "UP_NEXT",
    updatedAt: DAY(19),
  });
  await s.run({
    key: "upnext-run-ended",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(2),
  });
  await s.item({ user: "u1", key: "playing", status: "PLAYING" });
  await s.run({
    key: "playing",
    ordinal: 1,
    status: "PLAYING",
    playtimeMinutes: 90,
  });
  await s.item({
    user: "u1",
    key: "played",
    status: "PLAYED",
    hasBeenPlayed: true,
  });
  await s.run({
    key: "played",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(3),
    playtimeMinutes: 600,
  });
  await s.note("played", "u1", 600, 1);

  // Played variants
  await s.item({ user: "u1", key: "played-noruns", status: "PLAYED" });
  await s.item({ user: "u1", key: "played-abandoned", status: "PLAYED" });
  await s.run({
    key: "played-abandoned",
    ordinal: 1,
    status: "ABANDONED",
    finishedAt: DAY(4),
    playtimeMinutes: 20,
  });
  await s.run({
    key: "played-abandoned",
    ordinal: 2,
    status: "ABANDONED",
    finishedAt: DAY(5),
    playtimeMinutes: 10,
  });
  await s.item({ user: "u1", key: "played-mixed", status: "PLAYED" });
  await s.run({
    key: "played-mixed",
    ordinal: 1,
    status: "ABANDONED",
    finishedAt: DAY(4),
  });
  await s.run({
    key: "played-mixed",
    ordinal: 2,
    status: "FINISHED",
    finishedAt: DAY(6),
  });

  // Playing variants
  await s.item({
    user: "u1",
    key: "playing-noruns",
    status: "PLAYING",
    startedAt: DAY(7),
  });
  await s.item({ user: "u1", key: "playing-two-open", status: "PLAYING" });
  await s.run({
    key: "playing-two-open",
    ordinal: 1,
    status: "PLAYING",
    updatedAt: DAY(8),
  });
  await s.run({
    key: "playing-two-open",
    ordinal: 2,
    status: "PLAYING",
    updatedAt: DAY(9),
  });

  // Manual override: stored PLAYED, run still PLAYING
  await s.item({
    user: "u1",
    key: "manual",
    status: "PLAYED",
    statusIsManual: true,
    hasBeenPlayed: true,
  });
  await s.run({
    key: "manual",
    ordinal: 1,
    status: "PLAYING",
    updatedAt: DAY(10),
  });

  // Ratings
  await s.item({ user: "u1", key: "rating-on-run", status: "PLAYED" });
  await s.run({
    key: "rating-on-run",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(11),
    rating: 7,
  });
  await s.run({
    key: "rating-on-run",
    ordinal: 2,
    status: "FINISHED",
    finishedAt: DAY(12),
    rating: 9,
  });
  await s.item({ user: "u1", key: "rating-kept", status: "PLAYED", rating: 5 });
  await s.run({
    key: "rating-kept",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(11),
    rating: 9,
  });

  // Run-less item carrying dates
  await s.item({
    user: "u1",
    key: "runless-dates",
    status: "PLAYED",
    startedAt: DAY(13),
    completedAt: DAY(14),
  });

  // Time played: run minutes beyond the notes, run without notes, run-less notes only
  await s.item({ user: "u1", key: "time-gap", status: "PLAYED" });
  await s.run({
    key: "time-gap",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(15),
    playtimeMinutes: 300,
  });
  await s.note("time-gap", "u1", 120, 1);
  await s.item({ user: "u1", key: "time-no-notes", status: "PLAYED" });
  await s.run({
    key: "time-no-notes",
    ordinal: 1,
    status: "FINISHED",
    finishedAt: DAY(16),
    playtimeMinutes: 60,
  });
  await s.item({ user: "u1", key: "time-notes-only", status: "SHELF" });
  await s.note("time-notes-only", "u1", 45);

  // u2: seven Up Next items, day N = updatedAt, so day 7 is most recent
  for (let day = 1; day <= 7; day += 1) {
    await s.item({
      user: "u2",
      key: `queue-${day}`,
      status: "UP_NEXT",
      updatedAt: DAY(day),
    });
  }

  // u3 has one Up Next item of its own: the queue is per user
  await s.item({
    user: "u3",
    key: "u3-upnext",
    status: "UP_NEXT",
    updatedAt: DAY(1),
  });
}

const q = (client: Client, sql: string, params: unknown[] = []) =>
  client.query(sql, params).then((r) => r.rows);

describe("spec 026 migration A: mindful core model", () => {
  let db: LegacyDatabase;
  let countBefore = 0;
  let timeBefore = new Map<string, number>();

  beforeAll(async () => {
    db = await createLegacyDatabase("mindful_core_migration");
    await seedLegacyData(db.client);

    countBefore = Number(
      (await q(db.client, `SELECT count(*)::int AS n FROM "LibraryItem"`))[0].n
    );
    const before = await q(
      db.client,
      `SELECT li."gameId" AS game,
              CASE WHEN EXISTS (SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id)
                THEN (SELECT COALESCE(sum(p."playtimeMinutes"), 0) FROM "Playthrough" p WHERE p."libraryItemId" = li.id)
                ELSE (SELECT COALESCE(sum(j."playedMinutes"), 0) FROM "JournalEntry" j WHERE j."libraryItemId" = li.id)
              END::int AS minutes
       FROM "LibraryItem" li`
    );
    timeBefore = new Map(before.map((r) => [r.game, Number(r.minutes)]));

    await db.client.query(migrationSql(MIGRATION_A));
  }, 120_000);

  afterAll(async () => {
    await db?.teardown();
  });

  async function item(key: string) {
    const rows = await q(
      db.client,
      `SELECT "status"::text AS status, "isOwned", "doneOutcome"::text AS outcome,
              "upNextPosition" AS pos, "rating"
       FROM "LibraryItem" WHERE "gameId" = $1`,
      [`game-${key}`]
    );
    return rows[0] as {
      status: string;
      isOwned: boolean;
      outcome: string | null;
      pos: number | null;
      rating: number | null;
    };
  }

  async function runs(key: string) {
    return q(
      db.client,
      `SELECT p."ordinal", p."status"::text AS status, p."finishedAt",
          to_char(p."startedAt", 'YYYY-MM-DD"T"HH24:MI') AS started,
          to_char(p."finishedAt", 'YYYY-MM-DD"T"HH24:MI') AS finished, p."kind"::text AS kind
       FROM "Playthrough" p JOIN "LibraryItem" li ON li.id = p."libraryItemId"
       WHERE li."gameId" = $1 ORDER BY p."ordinal"`,
      [`game-${key}`]
    );
  }

  describe("status mapping (spec 2.12)", () => {
    it.each([
      [
        "wishlist",
        { status: "WANT", isOwned: false, outcome: null, pos: null },
      ],
      ["shelf", { status: "WANT", isOwned: true, outcome: null, pos: null }],
      [
        "upnext-fresh",
        { status: "WANT", isOwned: true, outcome: null, pos: 2 },
      ],
      [
        "upnext-played",
        { status: "DONE", isOwned: true, outcome: null, pos: 1 },
      ],
      [
        "upnext-run-ended",
        { status: "DONE", isOwned: true, outcome: null, pos: 3 },
      ],
      [
        "playing",
        { status: "PLAYING", isOwned: true, outcome: null, pos: null },
      ],
      ["played", { status: "DONE", isOwned: true, outcome: null, pos: null }],
    ])("%s", async (key, expected) => {
      expect(await item(key)).toMatchObject(expected);
    });
  });

  describe("Done outcome", () => {
    it("Played with no runs stays unset", async () => {
      expect((await item("played-noruns")).outcome).toBeNull();
    });

    it("Played with only abandoned runs becomes Let go", async () => {
      expect(await item("played-abandoned")).toMatchObject({
        status: "DONE",
        outcome: "LET_GO",
      });
    });

    it("Played with mixed runs stays unset", async () => {
      expect(await item("played-mixed")).toMatchObject({
        status: "DONE",
        outcome: null,
      });
    });
  });

  describe("Up Next queue", () => {
    it("keeps the five most recently updated, oldest two unqueued", async () => {
      const rows = await q(
        db.client,
        `SELECT "upNextPosition" AS pos FROM "LibraryItem"
         WHERE "gameId" LIKE 'game-queue-%' ORDER BY "gameId" DESC`
      );
      const positions = rows.map((r) => r.pos);
      expect(positions).toEqual([1, 2, 3, 4, 5, null, null]);
    });

    it("unqueued items still map to Want", async () => {
      expect((await item("queue-1")).status).toBe("WANT");
      expect((await item("queue-2")).status).toBe("WANT");
    });

    it("has at most five queued per user with unique positions", async () => {
      const rows = await q(
        db.client,
        `SELECT "userId", count(*)::int AS n, count(DISTINCT "upNextPosition")::int AS distinct_n,
                max("upNextPosition") AS max_pos, min("upNextPosition") AS min_pos
         FROM "LibraryItem" WHERE "upNextPosition" IS NOT NULL GROUP BY "userId"`
      );
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.n).toBeLessThanOrEqual(5);
        expect(row.distinct_n).toBe(row.n);
        expect(row.min_pos).toBeGreaterThanOrEqual(1);
        expect(row.max_pos).toBeLessThanOrEqual(5);
      }
    });

    it("ranks each user's queue independently", async () => {
      expect((await item("u3-upnext")).pos).toBe(1);
    });
  });

  describe("plays", () => {
    it("PLAYING with no runs gets one open play from startedAt", async () => {
      const rows = await runs("playing-noruns");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ status: "PLAYING", finishedAt: null });
      expect(rows[0].started).toBe("2026-03-07T10:00");
    });

    it("PLAYING with two open runs keeps the latest open and closes the other", async () => {
      const rows = await runs("playing-two-open");
      expect(rows).toHaveLength(2);
      expect(rows[0].finishedAt).not.toBeNull();
      expect(rows[1].finishedAt).toBeNull();
    });

    it("manual-override item stays Done and its open run is closed", async () => {
      expect(await item("manual")).toMatchObject({
        status: "DONE",
        outcome: null,
      });
      const rows = await runs("manual");
      expect(rows).toHaveLength(1);
      expect(rows[0].finishedAt).not.toBeNull();
    });

    it("run-less Played item with dates gets one ended play", async () => {
      const rows = await runs("runless-dates");
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        status: "FINISHED",
        ordinal: 1,
        kind: "FIRST",
      });
      expect(rows[0].started).toBe("2026-03-13T10:00");
      expect(rows[0].finished).toBe("2026-03-14T10:00");
    });

    it("run-less Played item without dates gets no play", async () => {
      expect(await runs("played-noruns")).toHaveLength(0);
    });

    it("open plays equal PLAYING items, one per item, none elsewhere", async () => {
      const rows = await q(
        db.client,
        `SELECT li."status"::text AS status, count(p.id)::int AS open_plays
         FROM "LibraryItem" li
         LEFT JOIN "Playthrough" p ON p."libraryItemId" = li.id AND p."finishedAt" IS NULL
         GROUP BY li.id, li."status"`
      );
      for (const row of rows) {
        expect(row.open_plays).toBe(row.status === "PLAYING" ? 1 : 0);
      }
      const [{ playing, open }] = await q(
        db.client,
        `SELECT (SELECT count(*)::int FROM "LibraryItem" WHERE "status" = 'PLAYING') AS playing,
                (SELECT count(*)::int FROM "Playthrough" WHERE "finishedAt" IS NULL) AS open`
      );
      expect(open).toBe(playing);
    });
  });

  describe("rating", () => {
    it("copies the highest run rating when the item has none", async () => {
      expect((await item("rating-on-run")).rating).toBe(9);
    });

    it("keeps an existing item rating", async () => {
      expect((await item("rating-kept")).rating).toBe(5);
    });
  });

  describe("time played", () => {
    it("adds a time-only note for the gap between run minutes and its notes", async () => {
      const rows = await q(
        db.client,
        `SELECT "playedMinutes", "content", "playthroughId", "gameId"
         FROM "JournalEntry" WHERE "gameId" = 'game-time-gap' ORDER BY "playedMinutes"`
      );
      expect(rows.map((r) => r.playedMinutes)).toEqual([120, 180]);
      const added = rows.find((r) => r.playedMinutes === 180);
      expect(added).toMatchObject({
        content: "",
        playthroughId: "run-time-gap-1",
      });
    });

    it("adds a note for a run whose minutes have no notes", async () => {
      const rows = await q(
        db.client,
        `SELECT "playedMinutes" FROM "JournalEntry" WHERE "gameId" = 'game-time-no-notes'`
      );
      expect(rows.map((r) => r.playedMinutes)).toEqual([60]);
    });

    it("does not duplicate minutes already covered by notes", async () => {
      const rows = await q(
        db.client,
        `SELECT count(*)::int AS n FROM "JournalEntry" WHERE "gameId" = 'game-played'`
      );
      expect(rows[0].n).toBe(1);
    });

    it("keeps every game's total time played unchanged", async () => {
      const after = await q(
        db.client,
        `SELECT li."gameId" AS game,
                COALESCE((SELECT sum(j."playedMinutes") FROM "JournalEntry" j WHERE j."libraryItemId" = li.id), 0)::int AS minutes
         FROM "LibraryItem" li`
      );
      expect(after).toHaveLength(timeBefore.size);
      for (const row of after) {
        expect({ game: row.game, minutes: row.minutes }).toEqual({
          game: row.game,
          minutes: timeBefore.get(row.game),
        });
      }
      expect([...timeBefore.values()].some((m) => m > 0)).toBe(true);
    });
  });

  describe("schema invariants", () => {
    it("leaves the LibraryItem row count unchanged", async () => {
      const [{ n }] = await q(
        db.client,
        `SELECT count(*)::int AS n FROM "LibraryItem"`
      );
      expect(n).toBe(countBefore);
    });

    it("flags every existing user for the status-model notice", async () => {
      const rows = await q(
        db.client,
        `SELECT "statusModelNoticePending" AS pending FROM "user"`
      );
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.pending === true)).toBe(true);
    });

    it("keeps the (userId, status) index", async () => {
      const rows = await q(
        db.client,
        `SELECT indexdef FROM pg_indexes WHERE indexname = 'LibraryItem_userId_status_idx'`
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].indexdef).toContain(`("userId", status)`);
    });

    it("replaces the status enum with Want / Playing / Done", async () => {
      const rows = await q(
        db.client,
        `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'LibraryItemStatus' ORDER BY e.enumsortorder`
      );
      expect(rows.map((r) => r.enumlabel)).toEqual(["WANT", "PLAYING", "DONE"]);
    });
  });
});

describe("spec 026 migration A: duplicate guard", () => {
  let db: LegacyDatabase;

  beforeAll(async () => {
    db = await createLegacyDatabase("mindful_core_dupe_guard");
    const s = new Seeder(db.client);
    await s.user("dup-user");
    await s.item({ user: "dup-user", key: "dup-a", status: "SHELF" });
    await db.client.query(
      `INSERT INTO "LibraryItem" ("userId", "gameId", "status", "updatedAt")
       VALUES ('dup-user', 'game-dup-a', 'PLAYED', NOW())`
    );
  }, 120_000);

  afterAll(async () => {
    await db?.teardown();
  });

  it("fails with a clear error and changes nothing", async () => {
    await expect(db.client.query(migrationSql(MIGRATION_A))).rejects.toThrow(
      /Duplicate \(userId, gameId\)/
    );
    const [{ exists }] = await q(
      db.client,
      `SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DoneOutcome') AS exists`
    );
    expect(exists).toBe(false);
  });
});
