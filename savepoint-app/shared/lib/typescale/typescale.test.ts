import { readFileSync } from "node:fs";
import { join } from "node:path";

const cssSource = readFileSync(
  join(import.meta.dirname, "../../globals.css"),
  "utf-8"
);

function extractDeclarationBlock(className: string): string {
  const pattern = new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`, "g");
  const matches = [...cssSource.matchAll(pattern)];

  if (matches.length === 0) {
    throw new Error(`CSS class ".${className}" not found in globals.css`);
  }
  if (matches.length > 1) {
    throw new Error(
      `CSS class ".${className}" appears ${matches.length} times in globals.css — ambiguous`
    );
  }

  const block = matches[0][1];
  return normalizeBlock(block);
}

function normalizeBlock(block: string): string {
  return block
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean)
    .sort()
    .join("; ");
}

const ALIAS_PAIRS: Array<[alias: string, legacy: string]> = [
  ["text-display", "display-lg"],
  ["text-h1", "heading-xl"],
  ["text-h2", "heading-lg"],
  ["text-h3", "heading-md"],
  ["text-body", "body-md"],
  ["text-caption", "caption"],
];

describe("typescale semantic aliases", () => {
  it.each(ALIAS_PAIRS)(
    ".%s produces identical CSS declarations to .%s",
    (alias, legacy) => {
      const aliasBlock = extractDeclarationBlock(alias);
      const legacyBlock = extractDeclarationBlock(legacy);
      expect(aliasBlock).toBe(legacyBlock);
    }
  );
});
