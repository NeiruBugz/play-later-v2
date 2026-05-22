import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "../..");

let eslint: ESLint;

// `eslintAsConfigured` loads eslint.config.mjs verbatim — no resolver
// override. This is the instance that proves the alias-resolution wiring in
// the real config works: if the `import/resolver.typescript` block is ever
// removed, the `@/`-aliased upward imports below stop resolving and the rule
// silently re-allows them, failing these tests.
let eslintAsConfigured: ESLint;

beforeAll(() => {
  eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
    overrideConfig: [
      {
        settings: {
          "import/resolver": {
            node: { extensions: [".ts", ".tsx", ".js", ".jsx"] },
          },
        },
      },
    ],
  });

  eslintAsConfigured = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
  });
});

describe("FSD boundaries ESLint rule — regression guard against silent disable", () => {
  it("reports boundaries/dependencies error when entities imports from features (upward import)", async () => {
    // File must be inside a slice subdirectory so it matches the per-slice
    // capture pattern `src/entities/([^/]+)/**/*` used by the redesigned
    // boundaries config (Slice 23).
    const syntheticFilePath = path.join(
      projectRoot,
      "src/entities/game/synthetic.ts"
    );

    const results = await eslint.lintText(
      `import { something } from "../../features/add-game/index";`,
      { filePath: syntheticFilePath }
    );

    const boundaryViolations = results[0].messages.filter(
      (msg) => msg.ruleId === "boundaries/dependencies"
    );

    expect(boundaryViolations.length).toBeGreaterThan(0);
  });

  it("reports zero boundaries/dependencies errors when widgets imports from features (allowed downward import)", async () => {
    const syntheticFilePath = path.join(
      projectRoot,
      "src/widgets/synthetic.ts"
    );

    const results = await eslint.lintText(
      `import { something } from "../features/index";`,
      { filePath: syntheticFilePath }
    );

    const boundaryViolations = results[0].messages.filter(
      (msg) => msg.ruleId === "boundaries/dependencies"
    );

    expect(boundaryViolations.length).toBe(0);
  });

  // Regression guard for the `@/` path-alias resolution gap (Slice 23): the
  // boundaries config previously declared no `import/resolver`, so the bundled
  // node resolver could not resolve TypeScript path aliases. The target of an
  // aliased import resolved to nothing and boundaries/dependencies silently
  // allowed ALL aliased imports — `lint` was green while enforcing nothing on
  // real (`@/`-prefixed) imports. These two cases use the config verbatim (no
  // resolver override) so they fail if the `import/resolver.typescript` wiring
  // is ever removed.
  describe("alias resolution — config loaded verbatim (no resolver override)", () => {
    it("flags an entities file importing @/features (aliased upward import)", async () => {
      const syntheticFilePath = path.join(
        projectRoot,
        "src/entities/profile/synthetic.ts"
      );

      const results = await eslintAsConfigured.lintText(
        `import { something } from "@/features/command-palette";`,
        { filePath: syntheticFilePath }
      );

      const boundaryViolations = results[0].messages.filter(
        (msg) => msg.ruleId === "boundaries/dependencies"
      );

      expect(boundaryViolations.length).toBeGreaterThan(0);
    });

    it("flags a features file importing @/app (aliased upward import)", async () => {
      const syntheticFilePath = path.join(
        projectRoot,
        "src/features/toggle-theme/synthetic.ts"
      );

      const results = await eslintAsConfigured.lintText(
        `import { ThemeProvider } from "@/app/providers/theme-provider";`,
        { filePath: syntheticFilePath }
      );

      const boundaryViolations = results[0].messages.filter(
        (msg) => msg.ruleId === "boundaries/dependencies"
      );

      expect(boundaryViolations.length).toBeGreaterThan(0);
    });
  });
});
