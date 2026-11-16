/**
 * RED regression guard for the `lambdas` layer rules (spec 030 tech 2.9).
 *
 * Contract (eslint.config.mjs, config loaded verbatim):
 *   `src/lambdas/**` may import `@/features/<slice>/api/*.worker`,
 *   `@/features/<slice>/model/*`, `@/entities/*`, `@/shared/*` and other
 *   `src/lambdas/**` files. It may NOT import `@/routes`, `@/widgets`, `@/app`,
 *   `react*`, `@tanstack/*`, `better-auth*`, or any feature file that is not an
 *   `api/*.worker` or `model/*`. Nothing outside `src/lambdas` may import it.
 * A violation is reported by `boundaries/dependencies` or `no-restricted-imports`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const lambdaFilePath = path.join(
  projectRoot,
  "src/lambdas/steam-sync-gather/synthetic.ts"
);

const LAYER_RULE_IDS = ["boundaries/dependencies", "no-restricted-imports"];

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
  });
});

async function layerViolations(code: string, filePath = lambdaFilePath) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter(
    (message) => message.ruleId && LAYER_RULE_IDS.includes(message.ruleId)
  );
}

describe("lambdas layer — allowed imports", () => {
  it.each([
    [
      "a feature worker",
      `import { runGatherMessage } from "@/features/storefront-sync/api/gather.worker";`,
    ],
    [
      "an entity query",
      `import { claimGather } from "@/entities/import-job/api/claim-gather.server";`,
    ],
    ["shared code", `import { createLogger } from "@/shared/lib";`],
    ["a node built-in", `import { readFile } from "node:fs/promises";`],
    [
      "a sibling lambdas helper",
      `import { processSqsBatch } from "../shared/sqs-batch";`,
    ],
    [
      "a feature model file",
      `import { gatherMessageSchema } from "@/features/storefront-sync/model/messages";`,
    ],
  ])("accepts %s", async (_label, code) => {
    expect(await layerViolations(code)).toHaveLength(0);
  });
});

describe("lambdas layer — forbidden imports", () => {
  it.each([
    ["a route", `import { Route } from "@/routes/_authed/import";`],
    ["a widget", `import { LibraryGrid } from "@/widgets/library-grid";`],
    [
      "the app layer",
      `import { ThemeProvider } from "@/app/providers/theme-provider";`,
    ],
    ["react", `import { useState } from "react";`],
    ["react-dom", `import { createRoot } from "react-dom/client";`],
    [
      "a TanStack Start module",
      `import { createServerFn } from "@tanstack/react-start";`,
    ],
    [
      "a TanStack Router module",
      `import { redirect } from "@tanstack/react-router";`,
    ],
    ["better-auth", `import { betterAuth } from "better-auth";`],
    [
      "a better-auth subpath",
      `import { createAuthClient } from "better-auth/react";`,
    ],
    [
      "a feature server-fn wrapper that is not a worker",
      `import { startSteamSyncFn } from "@/features/storefront-sync/api/start-steam-sync";`,
    ],
    [
      "a feature barrel",
      `import { SyncStartButton } from "@/features/storefront-sync";`,
    ],
    [
      "a feature ui file",
      `import { SyncStartButton } from "@/features/storefront-sync/ui/sync-start-button";`,
    ],
  ])("reports %s", async (_label, code) => {
    expect((await layerViolations(code)).length).toBeGreaterThan(0);
  });
});

describe("lambdas layer — importers", () => {
  it("reports a feature importing a lambda handler", async () => {
    const violations = await layerViolations(
      `import { handler } from "@/lambdas/steam-sync-gather/handler";`,
      path.join(projectRoot, "src/features/storefront-sync/api/synthetic.ts")
    );

    expect(violations.length).toBeGreaterThan(0);
  });
});
