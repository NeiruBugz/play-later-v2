import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "../..");

let eslint: ESLint;

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
});

describe("FSD boundaries ESLint rule — regression guard against silent disable", () => {
  it("reports boundaries/dependencies error when entities imports from features (upward import)", async () => {
    const syntheticFilePath = path.join(
      projectRoot,
      "src/entities/synthetic.ts"
    );

    const results = await eslint.lintText(
      `import { something } from "../features/index";`,
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
});
