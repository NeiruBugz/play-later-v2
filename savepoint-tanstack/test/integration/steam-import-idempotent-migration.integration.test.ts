/**
 * Runs the real `steam_import_idempotent` migration file against a database
 * that holds every earlier migration plus duplicate ImportedGame rows, and
 * checks which duplicate survives the dedupe step.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION = "20261104162139_steam_import_idempotent";
const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../prisma/migrations"
);
const DOCKER_CONTAINER = "savepoint-postgres";
const DB_NAME = "savepoint_tanstack_test_steam_import_dedupe";

function docker(command: string) {
  execSync(`docker exec ${DOCKER_CONTAINER} ${command}`, { stdio: "ignore" });
}

function migrationSql(name: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, name, "migration.sql"), "utf8");
}

type ImportedGameSeed = {
  id: string;
  storefrontGameId: string | null;
  igdbMatchStatus: "PENDING" | "MATCHED" | "UNMATCHED" | "IGNORED";
  updatedAt: string;
  deletedAt?: string;
};

let client: Client;

async function seedImportedGame(seed: ImportedGameSeed) {
  await client.query(
    `INSERT INTO "ImportedGame"
       ("id", "name", "storefront", "storefrontGameId", "igdbMatchStatus",
        "updatedAt", "deletedAt", "userId")
     VALUES ($1, $1, 'STEAM', $2, $3, $4, $5, 'dedupe-user')`,
    [
      seed.id,
      seed.storefrontGameId,
      seed.igdbMatchStatus,
      seed.updatedAt,
      seed.deletedAt ?? null,
    ]
  );
}

async function liveIdsFor(storefrontGameId: string | null): Promise<string[]> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM "ImportedGame"
     WHERE "deletedAt" IS NULL AND "storefrontGameId" IS NOT DISTINCT FROM $1
     ORDER BY id`,
    [storefrontGameId]
  );
  return result.rows.map((row) => row.id);
}

beforeAll(async () => {
  docker(`dropdb --if-exists -U postgres ${DB_NAME}`);
  docker(`createdb -U postgres ${DB_NAME}`);
  client = new Client({
    connectionString: `postgresql://postgres:postgres@localhost:6432/${DB_NAME}`,
  });
  await client.connect();

  const earlier = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name < MIGRATION)
    .map((entry) => entry.name)
    .sort();
  for (const name of earlier) {
    await client.query(migrationSql(name));
  }

  await client.query(
    `INSERT INTO "user" ("id", "updatedAt") VALUES ('dedupe-user', NOW())`
  );

  // An older MATCHED row and a newer PENDING duplicate of the same game.
  await seedImportedGame({
    id: "matched-older",
    storefrontGameId: "100",
    igdbMatchStatus: "MATCHED",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  await seedImportedGame({
    id: "pending-newer",
    storefrontGameId: "100",
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-06-01T00:00:00Z",
  });
  // Two untouched duplicates: the newer one survives.
  await seedImportedGame({
    id: "pending-older",
    storefrontGameId: "200",
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  await seedImportedGame({
    id: "pending-latest",
    storefrontGameId: "200",
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-06-01T00:00:00Z",
  });
  // A soft-deleted duplicate never competes with the live row.
  await seedImportedGame({
    id: "already-deleted",
    storefrontGameId: "300",
    igdbMatchStatus: "MATCHED",
    updatedAt: "2026-06-01T00:00:00Z",
    deletedAt: "2026-06-02T00:00:00Z",
  });
  await seedImportedGame({
    id: "lone-live",
    storefrontGameId: "300",
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  // Rows without a storefront id are left alone.
  await seedImportedGame({
    id: "no-id-a",
    storefrontGameId: null,
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  await seedImportedGame({
    id: "no-id-b",
    storefrontGameId: null,
    igdbMatchStatus: "PENDING",
    updatedAt: "2026-01-01T00:00:00Z",
  });

  await client.query(migrationSql(MIGRATION));
}, 60_000);

afterAll(async () => {
  await client?.end();
  try {
    docker(`dropdb --if-exists -U postgres ${DB_NAME}`);
  } catch {
    /* best-effort */
  }
});

describe("steam_import_idempotent migration", () => {
  describe("given an older MATCHED row and a newer PENDING duplicate", () => {
    it("keeps the MATCHED row live", async () => {
      expect(await liveIdsFor("100")).toEqual(["matched-older"]);
    });
  });

  describe("given duplicates the user never acted on", () => {
    it("keeps the most recently updated row live", async () => {
      expect(await liveIdsFor("200")).toEqual(["pending-latest"]);
    });
  });

  describe("given a soft-deleted duplicate", () => {
    it("leaves the only live row untouched", async () => {
      expect(await liveIdsFor("300")).toEqual(["lone-live"]);
    });
  });

  describe("given rows without a storefront id", () => {
    it("leaves them all live", async () => {
      expect(await liveIdsFor(null)).toEqual(["no-id-a", "no-id-b"]);
    });
  });

  describe("given the deduplicated table", () => {
    it("rejects a second live row for the same game", async () => {
      await expect(
        seedImportedGame({
          id: "duplicate-after",
          storefrontGameId: "200",
          igdbMatchStatus: "PENDING",
          updatedAt: "2026-07-01T00:00:00Z",
        })
      ).rejects.toThrow(
        /ImportedGame_live_userId_storefront_storefrontGameId_key/
      );
    });
  });
});
