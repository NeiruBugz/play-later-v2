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

async function messagesFor(ruleId: string, code: string) {
  const [result] = await eslint.lintText(code, {
    filePath: syntheticFilePath,
  });
  return result.messages.filter((m) => m.ruleId === ruleId);
}

const classNameSnippet = (classes: string) =>
  `export const A = () => <div className="${classes}" />;`;

describe("no-unknown-classes", () => {
  const rule = "better-tailwindcss/no-unknown-classes";

  it("reports a class the stylesheet does not define", async () => {
    const messages = await messagesFor(rule, classNameSnippet("px-xl flex"));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("px-xl");
  });

  it("allows stock utilities and the ignored marker classes", async () => {
    const messages = await messagesFor(
      rule,
      classNameSnippet("px-4 flex dark toaster text-muted-foreground")
    );

    expect(messages).toHaveLength(0);
  });

  it("checks classes passed to cn()", async () => {
    const messages = await messagesFor(
      rule,
      `export const A = () => <div className={cn("flex", "gap-lg")} />;`
    );

    expect(messages).toHaveLength(1);
  });
});

describe("no-conflicting-classes", () => {
  const rule = "better-tailwindcss/no-conflicting-classes";

  it("reports two classes that set the same property", async () => {
    const messages = await messagesFor(rule, classNameSnippet("p-2 p-4"));

    expect(messages.length).toBeGreaterThan(0);
  });

  it("allows classes that set different properties", async () => {
    const messages = await messagesFor(rule, classNameSnippet("p-2 text-xs"));

    expect(messages).toHaveLength(0);
  });
});

describe("no-restricted-classes", () => {
  const rule = "better-tailwindcss/no-restricted-classes";

  it.each([
    ["arbitrary pixel font size", "text-[11px]"],
    ["pixel font size behind a variant", "md:text-[10px]"],
    ["arbitrary hex color", "bg-[#2f8a82]"],
    ["arbitrary oklch color", "text-[oklch(0.5_0.1_200)]"],
    ["raw palette color", "bg-red-500"],
    ["raw palette color with opacity", "text-amber-400/80"],
    ["retired semantic spacing", "px-xl"],
    ["retired negative semantic spacing", "-mt-md"],
    ["retired type class", "heading-lg"],
    ["retired shadow", "shadow-paper"],
    ["retired duration", "duration-slow"],
    ["serif font", "font-serif"],
    ["terminal label", "terminal-label"],
  ])("reports %s", async (_name, className) => {
    const messages = await messagesFor(rule, classNameSnippet(className));

    expect(messages).toHaveLength(1);
  });

  it.each([
    "text-xs",
    "text-sm",
    "rounded-sm",
    "shadow-sm",
    "max-w-sm",
    "blur-sm",
    "px-4",
    "bg-primary",
    "text-muted-foreground",
    "bg-black/60",
    "text-white",
    "bg-[var(--card)]",
    "h-[480px]",
  ])("allows %s", async (className) => {
    const messages = await messagesFor(rule, classNameSnippet(className));

    expect(messages).toHaveLength(0);
  });
});

describe("inline color styles", () => {
  const rule = "no-restricted-syntax";
  const styled = (style: string) =>
    `export const A = () => <div style={{ ${style} }} />;`;

  it.each([
    'color: "#fff"',
    'backgroundColor: "red"',
    'borderColor: "rgb(0 0 0)"',
    'fill: "#2f8a82"',
    'stroke: "currentColor"',
    'background: "linear-gradient(red, blue)"',
  ])("reports %s", async (style) => {
    const messages = await messagesFor(rule, styled(style));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Inline color styles");
  });

  it.each([
    "color: `var(--status-${variant})`",
    'color: "var(--primary)"',
    "background: iconBg",
    'filter: "saturate(0.85)"',
    "width: `${percent}%`",
  ])("allows %s", async (style) => {
    const messages = await messagesFor(rule, styled(style));

    expect(messages).toHaveLength(0);
  });

  it("still reports asChild alongside the style rule", async () => {
    const messages = await messagesFor(
      rule,
      `export const A = () => <Button asChild />;`
    );

    expect(messages).toHaveLength(1);
  });
});
