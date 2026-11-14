import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const distDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist-lambdas"
);
const functionNames = ["steam-sync-gather", "steam-sync-enrich"];
const forbiddenPackages = [
  /^@tanstack\//,
  /^better-auth$/,
  /^@better-auth\//,
  /^react$/,
  /^react-dom$/,
  /^@aws-sdk\/client-s3$/,
];
const expectedZipEntries = ["index.mjs", "index.mjs.map"];

const importAndInvoke = `
const { handler } = await import(process.argv[1]);
const result = await handler({
  Records: [
    {
      messageId: "smoke-1",
      body: "not json",
      attributes: { ApproximateReceiveCount: "1" },
    },
  ],
});
process.stdout.write(JSON.stringify(result));
process.exit(0);
`;

const coreEnvOnly = {
  PATH: process.env.PATH,
  NODE_ENV: "production",
  POSTGRES_PRISMA_URL: "postgresql://smoke:smoke@127.0.0.1:1/smoke",
  IGDB_CLIENT_ID: "smoke",
  IGDB_CLIENT_SECRET: "smoke",
  STEAM_API_KEY: "smoke",
  LOG_LEVEL: "silent",
};

const failures = [];

function packageNameOf(input) {
  const marker = "node_modules/";
  const index = input.lastIndexOf(marker);
  if (index === -1) return undefined;
  const [first, second] = input.slice(index + marker.length).split("/");
  return first.startsWith("@") ? `${first}/${second}` : first;
}

function checkMetafile(name) {
  const metafile = JSON.parse(
    readFileSync(path.join(distDir, `${name}.meta.json`), "utf8")
  );
  for (const input of Object.keys(metafile.inputs)) {
    const packageName = packageNameOf(input);
    if (
      packageName &&
      forbiddenPackages.some((rule) => rule.test(packageName))
    ) {
      failures.push(`${name}: bundle includes ${packageName} via ${input}`);
    }
  }
}

function checkZip(name) {
  const zipPath = path.join(distDir, `${name}.zip`);
  const extractDir = mkdtempSync(path.join(tmpdir(), `${name}-`));
  try {
    execFileSync("unzip", ["-q", zipPath, "-d", extractDir]);
    const entries = readdirSync(extractDir).sort();
    if (entries.join() !== expectedZipEntries.join()) {
      failures.push(`${name}: zip entries are [${entries}]`);
      return;
    }
    const stdout = execFileSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        importAndInvoke,
        path.join(extractDir, "index.mjs"),
      ],
      { env: coreEnvOnly, cwd: extractDir, encoding: "utf8", timeout: 30_000 }
    );
    if (JSON.stringify(JSON.parse(stdout)) !== '{"batchItemFailures":[]}') {
      failures.push(`${name}: poison record not acked, got ${stdout}`);
    }
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : error}`);
  } finally {
    rmSync(extractDir, { recursive: true, force: true });
  }
}

for (const name of functionNames) {
  checkMetafile(name);
  checkZip(name);
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`${`smoke ok: ${functionNames.join(", ")}`}\n`);
