import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const outRoot = path.join(appRoot, "dist-lambdas");
const functionNames = ["steam-sync-gather", "steam-sync-enrich"];
const fixedMtime = new Date("2024-01-01T00:00:00Z");

const requireBanner = [
  'import { createRequire as __createRequire } from "node:module";',
  "const require = __createRequire(import.meta.url);",
].join("\n");

async function bundle(name) {
  const stagingDir = path.join(outRoot, name);
  rmSync(stagingDir, { recursive: true, force: true });
  const result = await build({
    absWorkingDir: appRoot,
    entryPoints: [`src/lambdas/${name}/index.ts`],
    outfile: path.join(stagingDir, "index.mjs"),
    bundle: true,
    platform: "node",
    target: "node22",
    format: "esm",
    tsconfig: "tsconfig.lambdas.json",
    define: { "process.env.NODE_ENV": '"production"' },
    external: ["pg-native"],
    banner: { js: requireBanner },
    sourcemap: "external",
    metafile: true,
    legalComments: "none",
    logLevel: "warning",
  });
  writeFileSync(
    path.join(outRoot, `${name}.meta.json`),
    JSON.stringify(result.metafile)
  );
  return stagingDir;
}

function zipDeterministically(name, stagingDir) {
  const entries = readdirSync(stagingDir).sort();
  for (const entry of entries) {
    utimesSync(path.join(stagingDir, entry), fixedMtime, fixedMtime);
  }
  const zipPath = path.join(outRoot, `${name}.zip`);
  rmSync(zipPath, { force: true });
  execFileSync("zip", ["-X", "-q", "-9", zipPath, ...entries], {
    cwd: stagingDir,
    env: { ...process.env, TZ: "UTC" },
  });
  return zipPath;
}

mkdirSync(outRoot, { recursive: true });
for (const name of functionNames) {
  const stagingDir = await bundle(name);
  const zipPath = zipDeterministically(name, stagingDir);
  const bytes = readdirSync(stagingDir).length;
  process.stdout.write(
    `${`built ${path.relative(appRoot, zipPath)} (${bytes} files)`}\n`
  );
}
