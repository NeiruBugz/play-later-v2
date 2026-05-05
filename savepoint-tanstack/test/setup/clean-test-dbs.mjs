import { execSync } from "node:child_process";

const DOCKER_CONTAINER = "savepoint-postgres";
const PG_USER = "postgres";
const TEST_DB_PATTERNS = [/^savepoint_tanstack_test_/, /^test_ts_/, /^test_/, /^test-/, /^savepoint-db-test/, /^test/];

const listOutput = execSync(
  `docker exec ${DOCKER_CONTAINER} psql -U ${PG_USER} -At -c "SELECT datname FROM pg_database WHERE datistemplate = false"`,
  { encoding: "utf8" }
);

const allDatabases = listOutput
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const matches = allDatabases.filter((name) =>
  TEST_DB_PATTERNS.some((pattern) => pattern.test(name))
);

if (matches.length === 0) {
  console.log("No test databases found.");
  process.exit(0);
}

console.log(`Dropping ${matches.length} test databases...`);

let dropped = 0;
let failed = 0;
for (const dbName of matches) {
  try {
    execSync(
      `docker exec ${DOCKER_CONTAINER} dropdb --if-exists -U ${PG_USER} "${dbName}"`,
      { stdio: "pipe" }
    );
    dropped += 1;
  } catch (err) {
    failed += 1;
    console.error(`  failed: ${dbName} — ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
  }
}

console.log(`Dropped ${dropped} databases (${failed} failed).`);
