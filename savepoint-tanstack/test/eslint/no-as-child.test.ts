import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const syntheticFilePath = path.join(projectRoot, "src/shared/ui/synthetic.tsx");

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({
    cwd: projectRoot,
    overrideConfigFile: path.join(projectRoot, "eslint.config.mjs"),
  });
});

async function restrictedSyntaxMessages(code: string) {
  const [result] = await eslint.lintText(code, {
    filePath: syntheticFilePath,
  });
  return result.messages.filter((m) => m.ruleId === "no-restricted-syntax");
}

describe("asChild ban", () => {
  it("reports the asChild JSX attribute", async () => {
    const messages = await restrictedSyntaxMessages(
      `export const A = () => <Button asChild><a href="/x" /></Button>;`
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("render");
  });

  it("allows the Base UI render prop", async () => {
    const messages = await restrictedSyntaxMessages(
      `export const A = () => <Button render={<a href="/x" />} />;`
    );

    expect(messages).toHaveLength(0);
  });
});
