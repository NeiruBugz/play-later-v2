import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATION_SQL_PATH = path.resolve(
  __dirname,
  "../../prisma/migrations/20260504152002_better_auth_migration/migration.sql"
);

const KNOWN_EPOCH = 1735689600; // 2025-01-01T00:00:00Z

// Local docker-compose defaults — same values used throughout test/setup files.
// A fresh temp database is created per test run to achieve full isolation.
const PG_HOST = "localhost";
const PG_PORT = 6432;
const PG_USER = "postgres";
const PG_PASSWORD = "postgres";
const DOCKER_CONTAINER = "savepoint-postgres";

function makeTempDbName(): string {
  return `test_ba_mig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function query<T extends Record<string, unknown>>(
  client: Client,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await client.query(sql, params);
  return result.rows as T[];
}

async function columnExists(
  client: Client,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    client,
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
    ) AS exists`,
    [table, column]
  );
  return rows[0].exists;
}

async function tableExists(client: Client, table: string): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    client,
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists`,
    [table]
  );
  return rows[0].exists;
}

async function indexExists(
  client: Client,
  indexName: string
): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    client,
    `SELECT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = $1
    ) AS exists`,
    [indexName]
  );
  return rows[0].exists;
}

describe("Better Auth Migration", () => {
  let client: Client;
  let tempDbName: string;

  // IDs for seeded rows
  const userId1 = "user-with-verified-email";
  const userId2 = "user-with-null-email-verified";
  const accountId = "account-cognito-01";
  const sessionId = "session-01";

  beforeAll(async () => {
    tempDbName = makeTempDbName();

    // Create a fresh isolated database (same pattern as status-simplification migration test)
    execSync(
      `docker exec ${DOCKER_CONTAINER} createdb -U ${PG_USER} ${tempDbName}`,
      { stdio: "ignore" }
    );

    client = new Client({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: tempDbName,
    });
    await client.connect();

    // ---------------------------------------------------------------
    // Build the pre-migration (NextAuth) table shapes.
    // DDL sourced from the init migration and subsequent alterations
    // up to (but not including) the BA migration.
    // ---------------------------------------------------------------

    await client.query(`
      CREATE TABLE "User" (
        id TEXT NOT NULL,
        name TEXT,
        email TEXT,
        "emailVerified" TIMESTAMP(3),
        image TEXT,
        password TEXT,
        username TEXT,
        "usernameNormalized" TEXT,
        "profileSetupCompletedAt" TIMESTAMP(3),
        "onboardingDismissedAt" TIMESTAMP(3),
        "isPublicProfile" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "steamProfileURL" TEXT,
        "steamId64" TEXT,
        "steamUsername" TEXT,
        "steamAvatar" TEXT,
        "steamConnectedAt" TIMESTAMP(3),
        CONSTRAINT "User_pkey" PRIMARY KEY (id)
      )
    `);

    await client.query(`CREATE UNIQUE INDEX "User_email_key" ON "User"(email)`);

    await client.query(`
      CREATE TABLE "Account" (
        id TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        CONSTRAINT "Account_pkey" PRIMARY KEY (id)
      )
    `);

    await client.query(`
      CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
        ON "Account"(provider, "providerAccountId")
    `);

    await client.query(`
      ALTER TABLE "Account"
        ADD CONSTRAINT "Account_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await client.query(`
      CREATE TABLE "Session" (
        id TEXT NOT NULL,
        "sessionToken" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        expires TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Session_pkey" PRIMARY KEY (id)
      )
    `);

    await client.query(
      `CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken")`
    );

    await client.query(`
      ALTER TABLE "Session"
        ADD CONSTRAINT "Session_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await client.query(`
      CREATE TABLE "VerificationToken" (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP(3) NOT NULL
      )
    `);

    await client.query(
      `CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"(token)`
    );

    await client.query(`
      CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"
        ON "VerificationToken"(identifier, token)
    `);

    // ---------------------------------------------------------------
    // Seed representative rows
    // ---------------------------------------------------------------

    // User with a non-null emailVerified → becomes true after migration
    await client.query(
      `INSERT INTO "User" (id, email, "emailVerified", name, "updatedAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId1, "alice@example.com", new Date("2024-01-15T10:00:00Z"), "Alice"]
    );

    // User with emailVerified = NULL → becomes false after migration
    await client.query(
      `INSERT INTO "User" (id, email, "emailVerified", name, "updatedAt")
       VALUES ($1, $2, NULL, $3, NOW())`,
      [userId2, "bob@example.com", "Bob"]
    );

    // Account with all NextAuth columns populated, known epoch for expires_at
    await client.query(
      `INSERT INTO "Account"
         (id, "userId", type, provider, "providerAccountId",
          refresh_token, access_token, id_token, expires_at,
          token_type, scope, session_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        accountId,
        userId1,
        "oauth",
        "cognito",
        "abc123",
        "refresh-tok",
        "access-tok",
        "id-tok",
        KNOWN_EPOCH,
        "Bearer",
        "openid profile email",
        "some-session-state",
      ]
    );

    // Session with a known token and expiry
    await client.query(
      `INSERT INTO "Session" (id, "sessionToken", "userId", expires)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, "tok-abc", userId1, new Date("2025-12-31T23:59:59Z")]
    );

    // VerificationToken row
    await client.query(
      `INSERT INTO "VerificationToken" (identifier, token, expires)
       VALUES ($1, $2, $3)`,
      ["alice@example.com", "verify-tok-xyz", new Date("2024-06-01T00:00:00Z")]
    );

    // ---------------------------------------------------------------
    // Execute the migration SQL
    // ---------------------------------------------------------------
    const migrationSql = fs.readFileSync(MIGRATION_SQL_PATH, "utf-8");
    await client.query(migrationSql);
  });

  afterAll(async () => {
    if (client) {
      await client.end();
    }
    try {
      execSync(
        `docker exec ${DOCKER_CONTAINER} dropdb --if-exists -U ${PG_USER} ${tempDbName}`,
        { stdio: "ignore" }
      );
    } catch {
      // best-effort cleanup
    }
  });

  // ---------------------------------------------------------------
  // Table-rename assertions
  // ---------------------------------------------------------------

  describe("table renames", () => {
    it('renames "User" to "user"', async () => {
      await expect(tableExists(client, "user")).resolves.toBe(true);
    });

    it('removes the old "User" table name', async () => {
      await expect(tableExists(client, "User")).resolves.toBe(false);
    });

    it('renames "Account" to "account"', async () => {
      await expect(tableExists(client, "account")).resolves.toBe(true);
    });

    it('removes the old "Account" table name', async () => {
      await expect(tableExists(client, "Account")).resolves.toBe(false);
    });

    it('renames "Session" to "session"', async () => {
      await expect(tableExists(client, "session")).resolves.toBe(true);
    });

    it('removes the old "Session" table name', async () => {
      await expect(tableExists(client, "Session")).resolves.toBe(false);
    });

    it('renames "VerificationToken" to "verification"', async () => {
      await expect(tableExists(client, "verification")).resolves.toBe(true);
    });

    it('removes the old "VerificationToken" table name', async () => {
      await expect(tableExists(client, "VerificationToken")).resolves.toBe(
        false
      );
    });
  });

  // ---------------------------------------------------------------
  // User table assertions
  // ---------------------------------------------------------------

  describe("user table — emailVerified boolean coercion", () => {
    it("converts non-null emailVerified timestamp to true", async () => {
      const rows = await query<{ emailVerified: boolean }>(
        client,
        `SELECT "emailVerified" FROM "user" WHERE id = $1`,
        [userId1]
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].emailVerified).toBe(true);
    });

    it("converts null emailVerified to false", async () => {
      const rows = await query<{ emailVerified: boolean }>(
        client,
        `SELECT "emailVerified" FROM "user" WHERE id = $1`,
        [userId2]
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].emailVerified).toBe(false);
    });

    it("preserves all user rows (no data loss)", async () => {
      const rows = await query<{ count: string }>(
        client,
        `SELECT COUNT(*) AS count FROM "user"`
      );
      expect(Number(rows[0].count)).toBe(2);
    });
  });

  // ---------------------------------------------------------------
  // Account table assertions
  // ---------------------------------------------------------------

  describe("account table — column renames and conversions", () => {
    it("renames provider to providerId with value preserved", async () => {
      const rows = await query<{ providerId: string }>(
        client,
        `SELECT "providerId" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].providerId).toBe("cognito");
    });

    it("renames providerAccountId to accountId with value preserved", async () => {
      const rows = await query<{ accountId: string }>(
        client,
        `SELECT "accountId" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].accountId).toBe("abc123");
    });

    it("renames access_token to accessToken with value preserved", async () => {
      const rows = await query<{ accessToken: string }>(
        client,
        `SELECT "accessToken" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].accessToken).toBe("access-tok");
    });

    it("renames refresh_token to refreshToken with value preserved", async () => {
      const rows = await query<{ refreshToken: string }>(
        client,
        `SELECT "refreshToken" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].refreshToken).toBe("refresh-tok");
    });

    it("renames id_token to idToken with value preserved", async () => {
      const rows = await query<{ idToken: string }>(
        client,
        `SELECT "idToken" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].idToken).toBe("id-tok");
    });

    it("converts expires_at epoch to accessTokenExpiresAt matching the known epoch second", async () => {
      // Use EXTRACT(EPOCH FROM ... AT TIME ZONE 'UTC') to get the UTC epoch seconds
      // directly from PostgreSQL, avoiding the pg client's local-timezone interpretation
      // of TIMESTAMP (non-tz) values.
      const rows = await query<{ epoch: string }>(
        client,
        `SELECT EXTRACT(EPOCH FROM "accessTokenExpiresAt" AT TIME ZONE 'UTC')::bigint AS epoch
         FROM "account" WHERE id = $1`,
        [accountId]
      );
      // KNOWN_EPOCH = 1735689600 = 2025-01-01T00:00:00Z
      expect(Number(rows[0].epoch)).toBe(KNOWN_EPOCH);
    });

    it("removes the expires_at integer column", async () => {
      await expect(columnExists(client, "account", "expires_at")).resolves.toBe(
        false
      );
    });

    it("removes the type column (NextAuth-specific)", async () => {
      await expect(columnExists(client, "account", "type")).resolves.toBe(
        false
      );
    });

    it("removes the token_type column (NextAuth-specific)", async () => {
      await expect(columnExists(client, "account", "token_type")).resolves.toBe(
        false
      );
    });

    it("removes the session_state column (NextAuth-specific)", async () => {
      await expect(
        columnExists(client, "account", "session_state")
      ).resolves.toBe(false);
    });

    it("adds refreshTokenExpiresAt column (nullable)", async () => {
      await expect(
        columnExists(client, "account", "refreshTokenExpiresAt")
      ).resolves.toBe(true);
    });

    it("adds password column (nullable)", async () => {
      await expect(columnExists(client, "account", "password")).resolves.toBe(
        true
      );
    });

    it("adds createdAt column with a non-null value", async () => {
      const rows = await query<{ createdAt: Date }>(
        client,
        `SELECT "createdAt" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].createdAt).toBeInstanceOf(Date);
    });

    it("adds updatedAt column with a non-null value", async () => {
      const rows = await query<{ updatedAt: Date }>(
        client,
        `SELECT "updatedAt" FROM "account" WHERE id = $1`,
        [accountId]
      );
      expect(rows[0].updatedAt).toBeInstanceOf(Date);
    });

    it("preserves all account rows (no data loss)", async () => {
      const rows = await query<{ count: string }>(
        client,
        `SELECT COUNT(*) AS count FROM "account"`
      );
      expect(Number(rows[0].count)).toBe(1);
    });

    it("drops old compound unique on (provider, providerAccountId)", async () => {
      await expect(
        indexExists(client, "Account_provider_providerAccountId_key")
      ).resolves.toBe(false);
    });

    it("creates new compound unique on (providerId, accountId)", async () => {
      await expect(
        indexExists(client, "account_providerId_accountId_key")
      ).resolves.toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Session table assertions
  // ---------------------------------------------------------------

  describe("session table — truncated and reshaped", () => {
    it("truncates all existing session rows", async () => {
      const rows = await query<{ count: string }>(
        client,
        `SELECT COUNT(*) AS count FROM "session"`
      );
      expect(Number(rows[0].count)).toBe(0);
    });

    it("has token column (renamed from sessionToken)", async () => {
      await expect(columnExists(client, "session", "token")).resolves.toBe(
        true
      );
    });

    it("has expiresAt column (renamed from expires)", async () => {
      await expect(columnExists(client, "session", "expiresAt")).resolves.toBe(
        true
      );
    });

    it("has ipAddress column", async () => {
      await expect(columnExists(client, "session", "ipAddress")).resolves.toBe(
        true
      );
    });

    it("has userAgent column", async () => {
      await expect(columnExists(client, "session", "userAgent")).resolves.toBe(
        true
      );
    });

    it("has createdAt column", async () => {
      await expect(columnExists(client, "session", "createdAt")).resolves.toBe(
        true
      );
    });

    it("has updatedAt column", async () => {
      await expect(columnExists(client, "session", "updatedAt")).resolves.toBe(
        true
      );
    });

    it("has unique index on token", async () => {
      await expect(indexExists(client, "session_token_key")).resolves.toBe(
        true
      );
    });
  });

  // ---------------------------------------------------------------
  // Verification table assertions
  // ---------------------------------------------------------------

  describe("verification table — truncated and reshaped", () => {
    it("truncates all existing verification rows", async () => {
      const rows = await query<{ count: string }>(
        client,
        `SELECT COUNT(*) AS count FROM "verification"`
      );
      expect(Number(rows[0].count)).toBe(0);
    });

    it("has id column as primary key", async () => {
      await expect(columnExists(client, "verification", "id")).resolves.toBe(
        true
      );
    });

    it("has value column (renamed from token)", async () => {
      await expect(columnExists(client, "verification", "value")).resolves.toBe(
        true
      );
    });

    it("has expiresAt column (renamed from expires)", async () => {
      await expect(
        columnExists(client, "verification", "expiresAt")
      ).resolves.toBe(true);
    });

    it("has createdAt column", async () => {
      await expect(
        columnExists(client, "verification", "createdAt")
      ).resolves.toBe(true);
    });

    it("has updatedAt column", async () => {
      await expect(
        columnExists(client, "verification", "updatedAt")
      ).resolves.toBe(true);
    });

    it("has unique index on value", async () => {
      await expect(indexExists(client, "verification_value_key")).resolves.toBe(
        true
      );
    });

    it("removes old compound unique on (identifier, token)", async () => {
      await expect(
        indexExists(client, "VerificationToken_identifier_token_key")
      ).resolves.toBe(false);
    });
  });
});
