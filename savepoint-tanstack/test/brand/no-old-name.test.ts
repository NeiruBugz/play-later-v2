import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const appRoot = resolve(__dirname, "../..");
const OLD_NAME = /savepoint/i;

// Internal package and legacy-app path names, never shown to a user.
const NON_USER_VISIBLE_PATH = /savepoint-(tanstack|app)/i;

const SCANNED_DIRECTORIES = ["src", "public"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx"]);
const MARKUP_EXTENSIONS = new Set([".css", ".json", ".html", ".svg", ".txt"]);

function isTestFile(path: string) {
  return /\.test\.(ts|tsx)$/.test(path);
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function userVisibleTextOfCode(path: string, source: string): string[] {
  const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    kind
  );
  const texts: string[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      texts.push(node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return texts;
}

function userVisibleTextOfMarkup(source: string): string[] {
  return [
    source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, ""),
  ];
}

function oldNameOffenders(): string[] {
  const offenders: string[] = [];
  for (const directory of SCANNED_DIRECTORIES) {
    for (const path of listFiles(join(appRoot, directory))) {
      const extension = extname(path);
      const isCode = CODE_EXTENSIONS.has(extension) && !isTestFile(path);
      if (!isCode && !MARKUP_EXTENSIONS.has(extension)) continue;
      const source = readFileSync(path, "utf8");
      const texts = isCode
        ? userVisibleTextOfCode(path, source)
        : userVisibleTextOfMarkup(source);
      for (const text of texts) {
        if (OLD_NAME.test(text) && !NON_USER_VISIBLE_PATH.test(text)) {
          offenders.push(
            `${relative(appRoot, path)}: ${text.trim().slice(0, 80)}`
          );
        }
      }
    }
  }
  return offenders;
}

describe("the old product name", () => {
  describe("given every string literal, JSX text, stylesheet, manifest and SVG under src/ and public/", () => {
    it("appears nowhere a user can see it", () => {
      expect(oldNameOffenders()).toEqual([]);
    });
  });
});
