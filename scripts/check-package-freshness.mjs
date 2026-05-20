#!/usr/bin/env node
// Fails when a PR introduces or upgrades an npm dep to a version published <N days ago.
// Mitigates supply-chain attacks via brand-new releases (covers SCS-04 from the 2026-05-18 audit).
//
// Usage:
//   node scripts/check-package-freshness.mjs [--base <ref>] [--head <ref>] [--days <n>]
// Defaults: --base origin/main --head HEAD --days 7

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(SCRIPT_DIR, "package-freshness-allowlist.json");

function loadAllowlist() {
  try {
    const raw = readFileSync(ALLOWLIST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const today = new Date();
    const active = [];
    const expired = [];
    for (const entry of parsed.entries ?? []) {
      if (!entry?.name || !entry?.version || !entry?.expires || !entry?.reason) continue;
      const expiresAt = new Date(entry.expires);
      if (Number.isNaN(expiresAt.getTime())) continue;
      if (expiresAt < today) expired.push(entry);
      else active.push(entry);
    }
    return { active, expired };
  } catch (err) {
    if (err.code === "ENOENT") return { active: [], expired: [] };
    console.warn(`! failed to read allowlist (${ALLOWLIST_PATH}): ${err.message}`);
    return { active: [], expired: [] };
  }
}

const ALLOWLIST = loadAllowlist();
if (ALLOWLIST.expired.length > 0) {
  console.warn(
    `! ${ALLOWLIST.expired.length} freshness allowlist entr${ALLOWLIST.expired.length === 1 ? "y is" : "ies are"} past their expiry and will be ignored:`,
  );
  for (const entry of ALLOWLIST.expired) {
    console.warn(`  - ${entry.name}@${entry.version} expired ${entry.expires}`);
  }
}

function isAllowlisted(name, version) {
  return ALLOWLIST.active.find((e) => e.name === name && e.version === version);
}

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce((acc, cur, idx, arr) => {
      if (cur.startsWith("--") && idx + 1 < arr.length) {
        acc.push([cur.slice(2), arr[idx + 1]]);
      }
      return acc;
    }, []),
);

const BASE = args.base ?? "origin/main";
const HEAD = args.head ?? "HEAD";
const MIN_AGE_DAYS = Number(args.days ?? 7);
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

const SECTIONS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function fileAtRef(ref, path) {
  try {
    return execSync(`git show ${ref}:${path}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    // File didn't exist at that ref — treat as if it had no deps. Caller will
    // see every current dep as "new" and check freshness on each, which is the
    // correct behavior for newly added package.json files.
    return null;
  }
}

function collectDeps(pkg) {
  const out = {};
  if (!pkg) return out;
  for (const section of SECTIONS) {
    const block = pkg[section];
    if (!block) continue;
    for (const [name, range] of Object.entries(block)) {
      out[`${section}::${name}`] = range;
    }
  }
  if (pkg.pnpm?.overrides) {
    for (const [name, range] of Object.entries(pkg.pnpm.overrides)) {
      out[`pnpm.overrides::${name}`] = range;
    }
  }
  return out;
}

function extractVersion(range) {
  if (typeof range !== "string") return null;
  if (range.startsWith("workspace:") || range.startsWith("file:") || range.startsWith("link:")) {
    return null;
  }
  const trimmed = range.replace(/^[\^~>=<]+/, "").trim();
  if (!/^\d+\.\d+\.\d+/.test(trimmed)) return null;
  return trimmed.split(/\s/)[0];
}

async function fetchPublishTime(name, version) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`registry fetch failed for ${name}: HTTP ${res.status}`);
  }
  const body = await res.json();
  const ts = body?.time?.[version];
  if (!ts) return null;
  return new Date(ts).getTime();
}

async function main() {
  let changed = [];
  try {
    changed = sh(`git diff --name-only ${BASE}...${HEAD}`)
      .split("\n")
      .filter((p) => /(^|\/)package\.json$/.test(p));
  } catch (err) {
    console.error(`git diff failed (base=${BASE}, head=${HEAD}): ${err.message}`);
    process.exit(2);
  }

  if (changed.length === 0) {
    console.log("freshness check: no package.json files changed.");
    return;
  }

  const violations = [];
  const checked = [];

  for (const path of changed) {
    const beforeRaw = fileAtRef(BASE, path);
    const afterRaw = fileAtRef(HEAD, path);
    const before = collectDeps(safeJsonParse(beforeRaw));
    const after = collectDeps(safeJsonParse(afterRaw));

    for (const [key, range] of Object.entries(after)) {
      if (before[key] === range) continue;
      const name = key.split("::")[1];
      const version = extractVersion(range);
      if (!version) continue;
      checked.push({ path, name, version });
      try {
        const publishedAt = await fetchPublishTime(name, version);
        if (publishedAt == null) {
          console.warn(`  ! no publish time for ${name}@${version} (skipped)`);
          continue;
        }
        const ageMs = Date.now() - publishedAt;
        if (ageMs < MIN_AGE_MS) {
          const ageDays = (ageMs / (24 * 60 * 60 * 1000)).toFixed(1);
          const waiver = isAllowlisted(name, version);
          if (waiver) {
            console.log(
              `  ~ ${name}@${version} (${ageDays}d) — allowlisted until ${waiver.expires}: ${waiver.reason}`,
            );
            continue;
          }
          violations.push({ path, name, version, ageDays, publishedAt });
        }
      } catch (err) {
        console.warn(`  ! registry error for ${name}@${version}: ${err.message}`);
      }
    }
  }

  console.log(
    `freshness check: ${checked.length} added/upgraded dep version(s) across ${changed.length} package.json file(s); minimum age ${MIN_AGE_DAYS} day(s).`,
  );

  if (violations.length === 0) {
    console.log("All checked versions are at least", MIN_AGE_DAYS, "days old.");
    return;
  }

  console.error("");
  console.error(`Found ${violations.length} dependency version(s) below the ${MIN_AGE_DAYS}-day quarantine:`);
  for (const v of violations) {
    console.error(
      `  - ${v.name}@${v.version} (published ${new Date(v.publishedAt).toISOString()}, ${v.ageDays} day(s) ago) in ${v.path}`,
    );
  }
  console.error("");
  console.error(
    "Either wait until the package ages past the quarantine, pin to an older version, override with `--days <n>` after a documented risk review, or add an entry to scripts/package-freshness-allowlist.json (with reason + expiry).",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("freshness check crashed:", err);
  process.exit(2);
});
