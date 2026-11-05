import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const stylesPath = join(appRoot, "src/styles.css");
const tailwindThemePath = join(appRoot, "node_modules/tailwindcss/theme.css");
const releaseOneRevision = "b6056d73^";

const spacingPrefixes = [
  "gap-x",
  "gap-y",
  "gap",
  "space-x",
  "space-y",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "p",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "m",
] as const;
type SpacingPrefix = (typeof spacingPrefixes)[number];

const spacingProperties: Record<SpacingPrefix, string[]> = {
  p: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  px: ["padding-right", "padding-left"],
  py: ["padding-top", "padding-bottom"],
  pt: ["padding-top"],
  pr: ["padding-right"],
  pb: ["padding-bottom"],
  pl: ["padding-left"],
  m: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  mx: ["margin-right", "margin-left"],
  my: ["margin-top", "margin-bottom"],
  mt: ["margin-top"],
  mr: ["margin-right"],
  mb: ["margin-bottom"],
  ml: ["margin-left"],
  gap: ["row-gap", "column-gap"],
  "gap-x": ["column-gap"],
  "gap-y": ["row-gap"],
  "space-x": ["space-x"],
  "space-y": ["space-y"],
};

const declaredCssProperties: Record<SpacingPrefix, string[]> = {
  ...spacingProperties,
  p: ["padding"],
  m: ["margin"],
  gap: ["gap"],
  px: ["padding-left", "padding-right"],
  py: ["padding-top", "padding-bottom"],
  mx: ["margin-left", "margin-right"],
  my: ["margin-top", "margin-bottom"],
};

const stockSpacingOrder: SpacingPrefix[] = [
  "m",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "p",
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "gap",
  "gap-x",
  "gap-y",
  "space-x",
  "space-y",
];

const stockSizeNames = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
];
const stockWeightNames = [
  "thin",
  "extralight",
  "light",
  "normal",
  "medium",
  "semibold",
  "bold",
  "extrabold",
  "black",
];
const stockShadowNames = ["xs", "sm", "md", "lg", "xl", "2xl", "none", "inner"];
const stockFamilyNames = ["sans", "serif", "mono", "display"];
const typeClassNames = [
  "heading-lg",
  "heading-md",
  "heading-sm",
  "heading-xs",
  "body-md",
  "body-sm",
  "text-display",
  "text-h1",
  "text-h2",
  "text-h3",
  "text-body",
  "text-caption",
];
const shadowClassNames = ["shadow-paper-sm", "shadow-paper", "shadow-paper-md"];

type Domain = "space" | "type" | "shadow" | "other";

type Replacement = {
  tokens: string[];
  properties: string[];
  domain: Domain;
  note?: string;
};

export type Mapping = {
  replacements: Map<string, Replacement>;
  sheetOrder: Map<string, number>;
  table: { from: string; to: string; note?: string }[];
};

const quarterRemSteps = (rem: number): string | undefined => {
  const steps = rem / 0.25;
  const rounded = Math.round(steps * 1000) / 1000;
  return Number.isFinite(rounded) && Math.abs(rounded - steps) < 1e-9
    ? String(rounded)
    : undefined;
};

const parseCssVariables = (css: string): Map<string, string> => {
  const variables = new Map<string, string>();
  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    if (!variables.has(match[1]!)) variables.set(match[1]!, match[2]!.trim());
  }
  return variables;
};

const extractUtilityBlocks = (css: string): Map<string, string> => {
  const blocks = new Map<string, string>();
  for (const match of css.matchAll(/@utility\s+([\w-]+)\s*\{/g)) {
    let depth = 1;
    let index = match.index! + match[0].length;
    const start = index;
    while (depth > 0 && index < css.length) {
      const char = css[index];
      if (char === "{") depth += 1;
      if (char === "}") depth -= 1;
      index += 1;
    }
    blocks.set(match[1]!, css.slice(start, index - 1));
  }
  return blocks;
};

const declarationsOf = (block: string): Map<string, string> => {
  const declarations = new Map<string, string>();
  for (const match of block.matchAll(
    /(?:^|[;{\s])([\w-]+)\s*:\s*([^;{}]+);/g
  )) {
    if (!declarations.has(match[1]!))
      declarations.set(match[1]!, match[2]!.trim());
  }
  return declarations;
};

const resolveVariable = (
  value: string,
  variables: Map<string, string>
): string => {
  const match = /^var\((--[\w-]+)\)$/.exec(value);
  if (!match) return value;
  const resolved = variables.get(match[1]!);
  if (resolved === undefined) {
    throw new Error(`styles.css: ${match[1]} is not declared`);
  }
  return resolveVariable(resolved, variables);
};

const remOf = (value: string): number | undefined => {
  const match = /^(-?[\d.]+)rem$/.exec(value);
  return match ? Number(match[1]) : undefined;
};

const readOldSheetOrder = (): Map<string, number> => {
  const prefix = execFileSync("git", ["rev-parse", "--show-prefix"], {
    cwd: appRoot,
    encoding: "utf8",
  }).trim();
  const oldCss = execFileSync(
    "git",
    ["show", `${releaseOneRevision}:${prefix}src/styles.css`],
    { cwd: appRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  const order = new Map<string, number>();
  oldCss.split("\n").forEach((line, index) => {
    const match = /^\s*\.([\w-]+)\s*(?:[{>,]|$)/.exec(line);
    if (match) order.set(match[1]!, index + 1);
  });
  return order;
};

export const buildMapping = (
  sheetOrder: Map<string, number> = readOldSheetOrder()
): Mapping => {
  const css = readFileSync(stylesPath, "utf8");
  const theme = readFileSync(tailwindThemePath, "utf8");
  if (/--spacing\s*:/.test(css)) {
    throw new Error(
      "styles.css overrides --spacing; step math assumes 0.25rem"
    );
  }
  const variables = parseCssVariables(css);
  const themeVariables = parseCssVariables(theme);
  const blocks = extractUtilityBlocks(css);
  const replacements = new Map<string, Replacement>();
  const table: Mapping["table"] = [];

  const spacingName = new RegExp(
    `^(-?)(${spacingPrefixes.join("|")})-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl)$`
  );
  for (const [name, block] of blocks) {
    const match = spacingName.exec(name);
    if (!match) continue;
    const prefix = match[2] as SpacingPrefix;
    const referenced = [...block.matchAll(/var\((--space-[\w]+)\)/g)].map(
      (m) => m[1]!
    );
    if (referenced.length === 0 || new Set(referenced).size !== 1) {
      throw new Error(`@utility ${name}: expected a single --space-* value`);
    }
    const declaredProperties = [
      ...new Set(
        [...block.matchAll(/([\w-]+)\s*:\s*var\(--space-/g)].map((m) => m[1]!)
      ),
    ];
    const expectsSpaceChild = prefix.startsWith("space-");
    const expectedProperties = expectsSpaceChild
      ? [prefix === "space-x" ? "margin-left" : "margin-top"]
      : declaredCssProperties[prefix];
    if (
      declaredProperties.sort().join() !== [...expectedProperties].sort().join()
    ) {
      throw new Error(
        `@utility ${name}: declares ${declaredProperties.join(", ")}, expected ${expectedProperties.join(", ")}`
      );
    }
    const rem = remOf(resolveVariable(`var(${referenced[0]})`, variables));
    const steps = rem === undefined ? undefined : quarterRemSteps(rem);
    const value =
      steps ?? `[${resolveVariable(`var(${referenced[0]})`, variables)}]`;
    const target = `${match[1]}${prefix}-${value}`;
    replacements.set(name, {
      tokens: [target],
      properties: spacingProperties[prefix],
      domain: "space",
      note: steps === undefined ? "no exact numeric step" : undefined,
    });
    table.push({
      from: name,
      to: target,
      note: `${referenced[0]} = ${resolveVariable(`var(${referenced[0]})`, variables)}${
        steps === undefined
          ? " (NO exact step, arbitrary value)"
          : Number.isInteger(Number(steps))
            ? ""
            : " (fractional step)"
      }`,
    });
  }

  const stockSizes = new Map<string, number>();
  for (const sizeName of stockSizeNames) {
    const rem = remOf(themeVariables.get(`--text-${sizeName}`) ?? "");
    if (rem !== undefined) stockSizes.set(sizeName, rem);
  }
  const stockWeights = new Map<number, string>(
    stockWeightNames.map((weightName) => [
      Number(themeVariables.get(`--font-weight-${weightName}`)),
      weightName,
    ])
  );
  for (const name of typeClassNames) {
    const block = blocks.get(name);
    if (!block) throw new Error(`@utility ${name} not found in styles.css`);
    const declarations = declarationsOf(block);
    const size = resolveVariable(declarations.get("font-size")!, variables);
    const rem = remOf(size);
    const sizeName = [...stockSizes].find(([, value]) => value === rem)?.[0];
    const weight = Number(
      resolveVariable(declarations.get("font-weight")!, variables)
    );
    const properties = ["font-size", "line-height", "font-weight"];
    const nearestSize = [...stockSizes].reduce((best, entry) =>
      Math.abs(entry[1] - (rem ?? 0)) < Math.abs(best[1] - (rem ?? 0))
        ? entry
        : best
    )[0];
    const tokens = [`text-${sizeName ?? nearestSize}`];
    if (declarations.get("font-family")) {
      properties.push("font-family");
      tokens.push("font-display");
    }
    if (weight !== 400) {
      tokens.push(`font-${stockWeights.get(weight) ?? "semibold"}`);
    }
    if (declarations.get("letter-spacing")) {
      properties.push("letter-spacing");
      const em = Number.parseFloat(
        resolveVariable(declarations.get("letter-spacing")!, variables)
      );
      if (em < 0) tokens.push("tracking-tight");
    }
    replacements.set(name, { tokens, properties, domain: "type" });
    table.push({ from: name, to: tokens.join(" ") });
  }

  const shadowTiers = new Map<string, number>();
  for (const name of shadowClassNames) {
    const block = blocks.get(name);
    if (!block) throw new Error(`@utility ${name} not found in styles.css`);
    const tier = /^var\(--shadow-paper(?:-(?:sm|md))?\)$/.test(
      declarationsOf(block).get("box-shadow") ?? ""
    )
      ? Number(
          /var\(--shadow-(\d)\)/.exec(
            variables.get(
              /var\((--shadow-paper[\w-]*)\)/.exec(
                declarationsOf(block).get("box-shadow")!
              )![1]!
            ) ?? ""
          )?.[1]
        )
      : NaN;
    if (!Number.isInteger(tier)) {
      throw new Error(`@utility ${name}: cannot resolve its --shadow-N tier`);
    }
    shadowTiers.set(name, tier);
  }
  const stockShadowByTier = ["xs", "sm", "md"];
  for (const [name, tier] of shadowTiers) {
    const target = `shadow-${stockShadowByTier[tier - 1]}`;
    replacements.set(name, {
      tokens: [target],
      properties: ["box-shadow"],
      domain: "shadow",
    });
    table.push({ from: name, to: target, note: `--shadow-${tier}` });
  }

  for (const name of replacements.keys()) {
    if (!sheetOrder.has(name)) {
      throw new Error(`${name} has no rule in the Release 1 stylesheet`);
    }
  }
  return { replacements, sheetOrder, table };
};

type ParsedToken = {
  raw: string;
  variants: string;
  important: "" | "prefix" | "suffix";
  core: string;
};

const splitTopLevel = (value: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value) {
    if (char === "[" || char === "(") depth += 1;
    if (char === "]" || char === ")") depth -= 1;
    if (char === separator && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
};

export const parseToken = (raw: string): ParsedToken => {
  const parts = splitTopLevel(raw, ":");
  const last = parts.pop()!;
  const variants = parts.length ? `${parts.join(":")}:` : "";
  if (last.startsWith("!")) {
    return { raw, variants, important: "prefix", core: last.slice(1) };
  }
  if (last.endsWith("!")) {
    return { raw, variants, important: "suffix", core: last.slice(0, -1) };
  }
  return { raw, variants, important: "", core: last };
};

const assemble = (parsed: ParsedToken, core: string): string =>
  parsed.important === "prefix"
    ? `${parsed.variants}!${core}`
    : parsed.important === "suffix"
      ? `${parsed.variants}${core}!`
      : `${parsed.variants}${core}`;

type Classified = {
  parsed: ParsedToken;
  domain: Domain;
  custom?: string;
  properties: string[];
  tokens: string[];
  sheetRank: number;
  spacingPrefix?: SpacingPrefix;
};

const stockSpacingPattern = new RegExp(
  `^(-?)(${spacingPrefixes.join("|")})-(.+)$`
);
const stockSpacingValue = /^(?:\d+(?:\.\d+)?|px|auto|\[.+\]|\(.+\))$/;

const classify = (raw: string, mapping: Mapping): Classified => {
  const parsed = parseToken(raw);
  const replacement = mapping.replacements.get(parsed.core);
  if (replacement) {
    return {
      parsed,
      domain: replacement.domain,
      custom: parsed.core,
      properties: replacement.properties,
      tokens: replacement.tokens.map((token) => assemble(parsed, token)),
      sheetRank: mapping.sheetOrder.get(parsed.core) ?? 0,
    };
  }
  const base: Classified = {
    parsed,
    domain: "other",
    properties: [],
    tokens: [raw],
    sheetRank: -1,
  };
  const spacing = stockSpacingPattern.exec(parsed.core);
  if (spacing && stockSpacingValue.test(spacing[3]!)) {
    const prefix = spacing[2] as SpacingPrefix;
    return {
      ...base,
      domain: "space",
      properties: spacingProperties[prefix],
      spacingPrefix: prefix,
    };
  }
  const size =
    /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?:\/.+)?$/.exec(
      parsed.core
    );
  if (size) {
    return {
      ...base,
      domain: "type",
      properties: ["font-size", "line-height"],
    };
  }
  if (/^leading-.+$/.test(parsed.core)) {
    return { ...base, domain: "type", properties: ["line-height"] };
  }
  if (/^tracking-.+$/.test(parsed.core)) {
    return { ...base, domain: "type", properties: ["letter-spacing"] };
  }
  const font = /^font-(.+)$/.exec(parsed.core);
  if (font && stockWeightNames.includes(font[1]!)) {
    return { ...base, domain: "type", properties: ["font-weight"] };
  }
  if (font && stockFamilyNames.includes(font[1]!)) {
    return { ...base, domain: "type", properties: ["font-family"] };
  }
  const shadow = /^shadow-(.+)$/.exec(parsed.core);
  if (shadow && stockShadowNames.includes(shadow[1]!)) {
    return { ...base, domain: "shadow", properties: ["box-shadow"] };
  }
  return base;
};

export type LiteralResult = {
  before: string;
  after: string;
  dropped: { removed: string; keptBecause: string; domain: Domain }[];
  orderSensitive: string[];
};

const overlapWinner = (
  first: Classified,
  second: Classified
): Classified | undefined => {
  if (first.custom && !second.custom) return first;
  if (second.custom && !first.custom) return second;
  if (first.custom && second.custom) {
    return first.sheetRank >= second.sheetRank ? first : second;
  }
  return undefined;
};

export const resolveConflicts = (
  entries: Classified[]
): {
  dropped: Map<number, Classified>;
  orderSensitive: string[];
} => {
  const dropped = new Map<number, Classified>();
  const orderSensitive: string[] = [];
  const keyOf = (entry: Classified) =>
    `${entry.parsed.variants}|${entry.parsed.important}|${entry.domain}`;

  entries.forEach((candidate, index) => {
    if (candidate.domain === "other" || candidate.properties.length === 0)
      return;
    const covering = candidate.properties.map((property) => {
      let winner: Classified | undefined;
      entries.forEach((rival, rivalIndex) => {
        if (rival === candidate || keyOf(rival) !== keyOf(candidate)) return;
        if (!rival.properties.includes(property)) return;
        const duel = candidate.custom
          ? overlapWinner(candidate, rival)
          : overlapWinner(rival, candidate);
        const rivalWins =
          rival.custom &&
          (!candidate.custom ||
            rival.sheetRank > candidate.sheetRank ||
            (rival.sheetRank === candidate.sheetRank && rivalIndex > index));
        if (duel && rivalWins) {
          if (!winner || (rival.custom && rival.sheetRank > winner.sheetRank)) {
            winner = rival;
          }
        }
      });
      return winner;
    });
    if (covering.every(Boolean)) dropped.set(index, covering[0]!);
  });

  entries.forEach((first, firstIndex) => {
    entries.forEach((second, secondIndex) => {
      if (secondIndex <= firstIndex) return;
      if (dropped.has(firstIndex) || dropped.has(secondIndex)) return;
      if (first.domain !== "space" || second.domain !== "space") return;
      if (keyOf(first) !== keyOf(second)) return;
      const shared = first.properties.filter((property) =>
        second.properties.includes(property)
      );
      if (shared.length === 0) return;
      const sheetWinner = overlapWinner(first, second);
      const firstPrefix = first.spacingPrefix ?? prefixOf(first);
      const secondPrefix = second.spacingPrefix ?? prefixOf(second);
      if (!sheetWinner || !firstPrefix || !secondPrefix) return;
      if (firstPrefix === secondPrefix) return;
      const stockWinner =
        stockSpacingOrder.indexOf(firstPrefix) >
        stockSpacingOrder.indexOf(secondPrefix)
          ? first
          : second;
      if (stockWinner !== sheetWinner) {
        orderSensitive.push(
          `${first.parsed.raw} + ${second.parsed.raw}: Release 1 rendered ${sheetWinner.parsed.raw} on ${shared.join(", ")}, stock order renders ${stockWinner.parsed.raw}`
        );
      }
    });
  });

  return { dropped, orderSensitive };
};

const prefixOf = (entry: Classified): SpacingPrefix | undefined => {
  const core = entry.custom ?? entry.parsed.core;
  const match = new RegExp(`^-?(${spacingPrefixes.join("|")})-`).exec(core);
  return match?.[1] as SpacingPrefix | undefined;
};

export const transformPool = (
  literals: string[],
  mapping: Mapping
): { results: LiteralResult[] } => {
  const entries: Classified[] = [];
  const owner: number[] = [];
  const tokenLists = literals.map((literal) =>
    literal.split(/\s+/).filter(Boolean)
  );
  tokenLists.forEach((tokens, literalIndex) => {
    for (const token of tokens) {
      entries.push(classify(token, mapping));
      owner.push(literalIndex);
    }
  });
  const { dropped, orderSensitive } = resolveConflicts(entries);

  const results: LiteralResult[] = literals.map((before) => ({
    before,
    after: before,
    dropped: [],
    orderSensitive,
  }));
  const rebuilt: string[][] = literals.map(() => []);
  entries.forEach((entry, index) => {
    const literalIndex = owner[index]!;
    const winner = dropped.get(index);
    if (winner) {
      results[literalIndex]!.dropped.push({
        removed: entry.parsed.raw,
        keptBecause: winner.parsed.raw,
        domain: entry.domain,
      });
      return;
    }
    rebuilt[literalIndex]!.push(...entry.tokens);
  });
  results.forEach((result, literalIndex) => {
    const original = tokenLists[literalIndex]!;
    const changed =
      result.dropped.length > 0 ||
      rebuilt[literalIndex]!.join(" ") !== original.join(" ");
    result.after = changed ? rebuilt[literalIndex]!.join(" ") : result.before;
  });
  return { results };
};

export const mapClassString = (value: string, mapping: Mapping): string =>
  transformPool([value], mapping).results[0]!.after;

type LiteralSite = {
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;
  poolId: number;
  line: number;
};

type CallContext = "cn" | "cva" | "attribute";
type Collected = {
  literals: LiteralSite[];
  skippedTemplates: { line: number; text: string }[];
};

const functionName = (call: ts.CallExpression): string | undefined =>
  ts.isIdentifier(call.expression) ? call.expression.text : undefined;

const isClassAttribute = (name: string): boolean =>
  /^(?:[a-z]\w*)?[cC]lassName$/.test(name);

const collectFromExpression = (
  node: ts.Node,
  sourceFile: ts.SourceFile,
  collected: Collected,
  nextPool: () => number,
  pool: number,
  context: CallContext
): void => {
  const lineOf = (target: ts.Node) =>
    sourceFile.getLineAndCharacterOfPosition(target.getStart(sourceFile)).line +
    1;
  const visit = (current: ts.Node, currentPool: number): void => {
    if (
      ts.isStringLiteral(current) ||
      ts.isNoSubstitutionTemplateLiteral(current)
    ) {
      collected.literals.push({
        node: current,
        poolId: currentPool,
        line: lineOf(current),
      });
      return;
    }
    if (ts.isTemplateExpression(current)) {
      collected.skippedTemplates.push({
        line: lineOf(current),
        text: current.getText(sourceFile),
      });
      return;
    }
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current)
    ) {
      visit(current.expression, currentPool);
      return;
    }
    if (ts.isConditionalExpression(current)) {
      visit(current.whenTrue, nextPool());
      visit(current.whenFalse, nextPool());
      return;
    }
    if (ts.isBinaryExpression(current)) {
      const operator = current.operatorToken.kind;
      if (operator === ts.SyntaxKind.AmpersandAmpersandToken) {
        visit(current.right, nextPool());
      } else if (
        operator === ts.SyntaxKind.BarBarToken ||
        operator === ts.SyntaxKind.QuestionQuestionToken
      ) {
        visit(current.left, nextPool());
        visit(current.right, nextPool());
      }
      return;
    }
    if (ts.isArrayLiteralExpression(current)) {
      current.elements.forEach((element) => visit(element, nextPool()));
      return;
    }
    if (ts.isObjectLiteralExpression(current)) {
      if (context === "cn") {
        current.properties.forEach((property) => {
          if (
            ts.isPropertyAssignment(property) &&
            ts.isStringLiteral(property.name)
          ) {
            collected.literals.push({
              node: property.name,
              poolId: nextPool(),
              line: lineOf(property),
            });
          }
        });
      }
      return;
    }
    if (ts.isCallExpression(current)) {
      handleCall(current, sourceFile, collected, nextPool);
    }
  };
  visit(node, pool);
};

const handleCall = (
  call: ts.CallExpression,
  sourceFile: ts.SourceFile,
  collected: Collected,
  nextPool: () => number
): void => {
  const name = functionName(call);
  if (name === "cn") {
    const sharedPool = nextPool();
    call.arguments.forEach((argument) => {
      const direct =
        ts.isStringLiteral(argument) ||
        ts.isNoSubstitutionTemplateLiteral(argument);
      collectFromExpression(
        argument,
        sourceFile,
        collected,
        nextPool,
        direct ? sharedPool : nextPool(),
        "cn"
      );
    });
    return;
  }
  if (name === "cva") {
    const [base, config] = call.arguments;
    if (base) {
      collectFromExpression(
        base,
        sourceFile,
        collected,
        nextPool,
        nextPool(),
        "cva"
      );
    }
    if (config && ts.isObjectLiteralExpression(config)) {
      for (const property of config.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        const key = property.name.getText(sourceFile);
        if (
          key === "variants" &&
          ts.isObjectLiteralExpression(property.initializer)
        ) {
          for (const group of property.initializer.properties) {
            if (
              ts.isPropertyAssignment(group) &&
              ts.isObjectLiteralExpression(group.initializer)
            ) {
              for (const option of group.initializer.properties) {
                if (ts.isPropertyAssignment(option)) {
                  collectFromExpression(
                    option.initializer,
                    sourceFile,
                    collected,
                    nextPool,
                    nextPool(),
                    "cva"
                  );
                }
              }
            }
          }
        }
        if (
          key === "compoundVariants" &&
          ts.isArrayLiteralExpression(property.initializer)
        ) {
          for (const item of property.initializer.elements) {
            if (!ts.isObjectLiteralExpression(item)) continue;
            for (const entry of item.properties) {
              if (
                ts.isPropertyAssignment(entry) &&
                ["class", "className"].includes(entry.name.getText(sourceFile))
              ) {
                collectFromExpression(
                  entry.initializer,
                  sourceFile,
                  collected,
                  nextPool,
                  nextPool(),
                  "cva"
                );
              }
            }
          }
        }
      }
    }
  }
};

export const collectClassSites = (sourceFile: ts.SourceFile): Collected => {
  const collected: Collected = { literals: [], skippedTemplates: [] };
  let poolCounter = 0;
  const nextPool = () => (poolCounter += 1);
  const seen = new Set<ts.Node>();
  const walk = (node: ts.Node): void => {
    if (
      ts.isJsxAttribute(node) &&
      isClassAttribute(node.name.getText(sourceFile)) &&
      node.initializer
    ) {
      const expression = ts.isJsxExpression(node.initializer)
        ? node.initializer.expression
        : node.initializer;
      if (expression) {
        collectFromExpression(
          expression,
          sourceFile,
          collected,
          nextPool,
          nextPool(),
          "attribute"
        );
      }
      markDescendants(node, seen);
      return;
    }
    if (ts.isCallExpression(node) && !seen.has(node)) {
      const name = functionName(node);
      if (name === "cn" || name === "cva") {
        handleCall(node, sourceFile, collected, nextPool);
        markDescendants(node, seen);
        return;
      }
    }
    ts.forEachChild(node, walk);
  };
  const markDescendants = (node: ts.Node, into: Set<ts.Node>) => {
    ts.forEachChild(node, function mark(child) {
      into.add(child);
      ts.forEachChild(child, mark);
    });
  };
  walk(sourceFile);
  const unique = new Map<ts.Node, LiteralSite>();
  collected.literals.forEach((site) => unique.set(site.node, site));
  collected.literals = [...unique.values()];
  return collected;
};

const literalText = (site: LiteralSite): string => site.node.text;

export type FileResult = {
  file: string;
  updated: string;
  changes: {
    line: number;
    before: string;
    after: string;
    dropped: LiteralResult["dropped"];
  }[];
  orderSensitive: { line: number; message: string }[];
  skippedTemplates: { line: number; text: string }[];
  literalCount: number;
};

export const transformSource = (
  file: string,
  source: string,
  mapping: Mapping
): FileResult => {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const collected = collectClassSites(sourceFile);
  const pools = new Map<number, LiteralSite[]>();
  collected.literals.forEach((site) => {
    pools.set(site.poolId, [...(pools.get(site.poolId) ?? []), site]);
  });

  const edits: { start: number; end: number; text: string }[] = [];
  const changes: FileResult["changes"] = [];
  const orderSensitive: FileResult["orderSensitive"] = [];
  for (const sites of pools.values()) {
    const { results } = transformPool(sites.map(literalText), mapping);
    sites.forEach((site, index) => {
      const result = results[index]!;
      if (index === 0) {
        [...new Set(result.orderSensitive)].forEach((message) =>
          orderSensitive.push({ line: site.line, message })
        );
      }
      if (result.after === result.before) return;
      const quoteOffset = 1;
      edits.push({
        start: site.node.getStart(sourceFile) + quoteOffset,
        end: site.node.getEnd() - quoteOffset,
        text: result.after,
      });
      changes.push({
        line: site.line,
        before: result.before,
        after: result.after,
        dropped: result.dropped,
      });
    });
  }
  let updated = source;
  edits
    .sort((a, b) => b.start - a.start)
    .forEach((edit) => {
      updated =
        updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
    });
  return {
    file,
    updated,
    changes: changes.sort((a, b) => a.line - b.line),
    orderSensitive,
    skippedTemplates: collected.skippedTemplates,
    literalCount: collected.literals.length,
  };
};

const sourceFilesUnder = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFilesUnder(path);
    return /\.(ts|tsx)$/.test(entry) && !/\.gen\.ts$/.test(entry) ? [path] : [];
  });

const retiredNamePattern = (mapping: Mapping): RegExp =>
  new RegExp(
    `(?<![\\w-])(?:[\\w\\[\\]&>*=:.()/-]+:)*!?-?(?:${[
      ...mapping.replacements.keys(),
    ]
      .map((name) => name.replace(/[-]/g, "\\-"))
      .join("|")})!?(?![\\w-])`,
    "g"
  );

const printMapping = (mapping: Mapping): void => {
  const group = (title: string, domain: Domain) => {
    console.log(`\n${title}`);
    for (const row of mapping.table) {
      if (mapping.replacements.get(row.from)?.domain !== domain) continue;
      console.log(
        `  ${row.from.padEnd(16)} -> ${row.to}${row.note ? `   [${row.note}]` : ""}`
      );
    }
  };
  group("Spacing (derived from src/styles.css --space-*)", "space");
  group(
    "Typography (derived from the @utility blocks + tailwindcss/theme.css)",
    "type"
  );
  group("Shadows (--shadow-paper-* tier -> stock tier)", "shadow");
};

type Options = {
  write: boolean;
  showMapping: boolean;
  usage: boolean;
  crossFileReport: boolean;
  directories: string[];
};

const parseArguments = (argv: string[]): Options => {
  const options: Options = {
    write: false,
    showMapping: false,
    usage: false,
    crossFileReport: false,
    directories: [],
  };
  for (const argument of argv) {
    if (argument === "--write") options.write = true;
    else if (argument === "--mapping") options.showMapping = true;
    else if (argument === "--usage") options.usage = true;
    else if (argument === "--cross-file-report") options.crossFileReport = true;
    else if (argument.startsWith("--"))
      throw new Error(`Unknown flag ${argument}`);
    else options.directories.push(resolve(argument));
  }
  return options;
};

const runUsage = (mapping: Mapping, directories: string[]): void => {
  const css = readFileSync(stylesPath, "utf8");
  const names = [...extractUtilityBlocks(css).keys()].filter((name) =>
    mapping.replacements.has(name)
  );
  const srcFiles = sourceFilesUnder(join(appRoot, "src")).filter(
    (path) => !path.endsWith("routeTree.gen.ts")
  );
  console.log(
    `\nRetired-name usage (${names.length} custom utilities, files counted under src/, tests included)`
  );
  const rows = names.map((name) => {
    const pattern = new RegExp(
      `(?<![\\w-])${name.replace(/-/g, "\\-")}(?![\\w-])`,
      "g"
    );
    const inTargets: string[] = [];
    const elsewhere = new Map<string, number>();
    for (const path of srcFiles) {
      const hits = readFileSync(path, "utf8").match(pattern)?.length ?? 0;
      if (!hits) continue;
      if (directories.some((directory) => path.startsWith(directory))) {
        inTargets.push(relative(appRoot, path));
      } else {
        const layer = relative(join(appRoot, "src"), path).split("/")[0]!;
        elsewhere.set(layer, (elsewhere.get(layer) ?? 0) + hits);
      }
    }
    return { name, inTargets, elsewhere };
  });
  const unused = rows.filter((row) => row.inTargets.length === 0);
  const stillUsed = rows.filter((row) => row.inTargets.length > 0);
  console.log(`  unused inside the target directories (${unused.length}):`);
  unused.forEach((row) =>
    console.log(
      `    ${row.name.padEnd(16)} elsewhere: ${[...row.elsewhere].map(([k, v]) => `${k} ${v}`).join(", ") || "nowhere"}`
    )
  );
  console.log(
    `  still used inside the target directories (${stillUsed.length}):`
  );
  stillUsed.forEach((row) =>
    console.log(`    ${row.name.padEnd(16)} ${row.inTargets.join(", ")}`)
  );
};

const crossFileReport = (mapping: Mapping): string => {
  const prefix = execFileSync("git", ["rev-parse", "--show-prefix"], {
    cwd: appRoot,
    encoding: "utf8",
  }).trim();
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd: appRoot,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
  const uiFiles = git(
    "ls-tree",
    "-r",
    "--name-only",
    releaseOneRevision,
    "--",
    "src/shared/ui"
  )
    .split("\n")
    .filter((path) => /\.tsx$/.test(path) && !/\.test\./.test(path));

  type ReleaseOneClass = { token: Classified; origin: string };
  const components = new Map<string, ReleaseOneClass[]>();

  for (const path of uiFiles) {
    const source = git("show", `${releaseOneRevision}:${prefix}${path}`);
    const sourceFile = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const variantConsts = new Map<string, ts.CallExpression>();
    sourceFile.statements.forEach((statement) => {
      if (!ts.isVariableStatement(statement)) return;
      statement.declarationList.declarations.forEach((declaration) => {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer &&
          ts.isCallExpression(declaration.initializer) &&
          functionName(declaration.initializer) === "cva"
        ) {
          variantConsts.set(declaration.name.text, declaration.initializer);
        }
      });
    });

    const classesOfVariantConst = (
      call: ts.CallExpression,
      chosen: Map<string, string>
    ): string[] => {
      const [base, config] = call.arguments;
      const classes: string[] = [];
      if (
        base &&
        (ts.isStringLiteral(base) || ts.isNoSubstitutionTemplateLiteral(base))
      ) {
        classes.push(base.text);
      }
      if (config && ts.isObjectLiteralExpression(config)) {
        const property = (object: ts.ObjectLiteralExpression, key: string) =>
          object.properties.find(
            (p): p is ts.PropertyAssignment =>
              ts.isPropertyAssignment(p) &&
              p.name.getText(sourceFile).replace(/["']/g, "") === key
          );
        const variants = property(config, "variants")?.initializer;
        const defaults = property(config, "defaultVariants")?.initializer;
        if (variants && ts.isObjectLiteralExpression(variants)) {
          for (const group of variants.properties) {
            if (
              !ts.isPropertyAssignment(group) ||
              !ts.isObjectLiteralExpression(group.initializer)
            )
              continue;
            const groupName = group.name.getText(sourceFile);
            const defaultValue =
              defaults && ts.isObjectLiteralExpression(defaults)
                ? property(defaults, groupName)?.initializer
                : undefined;
            const wanted =
              chosen.get(groupName) ??
              (defaultValue && ts.isStringLiteral(defaultValue)
                ? defaultValue.text
                : undefined);
            const option = wanted
              ? property(group.initializer, wanted)?.initializer
              : undefined;
            if (
              option &&
              (ts.isStringLiteral(option) ||
                ts.isNoSubstitutionTemplateLiteral(option))
            ) {
              classes.push(option.text);
            }
          }
        }
      }
      return classes;
    };

    const rootClassName = (body: ts.Node): ts.Expression | undefined => {
      let found: ts.Expression | undefined;
      const visit = (node: ts.Node): void => {
        if (found) return;
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const attribute = node.attributes.properties.find(
            (p): p is ts.JsxAttribute =>
              ts.isJsxAttribute(p) && p.name.getText(sourceFile) === "className"
          );
          if (attribute?.initializer) {
            found = ts.isJsxExpression(attribute.initializer)
              ? attribute.initializer.expression
              : attribute.initializer;
          }
          if (!found) ts.forEachChild(node, visit);
          return;
        }
        ts.forEachChild(node, visit);
      };
      visit(body);
      return found;
    };

    const registerComponent = (name: string, body: ts.Node) => {
      if (!/^[A-Z]/.test(name)) return;
      const expression = rootClassName(body);
      if (!expression) return;
      const texts: string[] = [];
      const gather = (node: ts.Node): void => {
        if (
          ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node)
        ) {
          texts.push(node.text);
          return;
        }
        if (ts.isCallExpression(node)) {
          const callee = functionName(node);
          if (callee && variantConsts.has(callee)) {
            texts.push(
              ...classesOfVariantConst(variantConsts.get(callee)!, new Map())
            );
            return;
          }
          if (callee === "cn") {
            node.arguments.forEach(gather);
            return;
          }
          return;
        }
        if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)) {
          gather(node.expression);
          return;
        }
        if (ts.isConditionalExpression(node)) {
          gather(node.whenTrue);
          gather(node.whenFalse);
        }
      };
      gather(expression);
      const classes: ReleaseOneClass[] = [];
      for (const text of texts) {
        for (const token of text.split(/\s+/).filter(Boolean)) {
          const classified = classify(token, mapping);
          if (classified.domain === "space") {
            classes.push({ token: classified, origin: path });
          }
        }
      }
      if (classes.length) components.set(name, classes);
    };

    const visitTop = (node: ts.Node): void => {
      if (ts.isFunctionDeclaration(node) && node.name && node.body) {
        registerComponent(node.name.text, node.body);
      }
      if (ts.isVariableStatement(node)) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            registerComponent(declaration.name.text, declaration.initializer);
          }
        });
      }
    };
    sourceFile.statements.forEach(visitTop);
  }

  const rows: string[] = [];
  const srcFiles = sourceFilesUnder(join(appRoot, "src")).filter(
    (path) => /\.tsx$/.test(path) && !/\.test\./.test(path)
  );
  for (const path of srcFiles) {
    const sourceFile = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sourceFile);
        const releaseOne = components.get(tag);
        const attribute = node.attributes.properties.find(
          (p): p is ts.JsxAttribute =>
            ts.isJsxAttribute(p) && p.name.getText(sourceFile) === "className"
        );
        if (releaseOne && attribute?.initializer) {
          const collected: Collected = { literals: [], skippedTemplates: [] };
          let counter = 0;
          const expression = ts.isJsxExpression(attribute.initializer)
            ? attribute.initializer.expression
            : attribute.initializer;
          if (expression) {
            collectFromExpression(
              expression,
              sourceFile,
              collected,
              () => (counter += 1),
              0,
              "attribute"
            );
          }
          for (const site of collected.literals) {
            for (const token of site.node.text.split(/\s+/).filter(Boolean)) {
              const callSite = classify(token, mapping);
              if (callSite.domain !== "space") continue;
              for (const base of releaseOne) {
                const sameKey =
                  base.token.parsed.variants === callSite.parsed.variants &&
                  base.token.parsed.important === callSite.parsed.important;
                const overlap = base.token.properties.some((property) =>
                  callSite.properties.includes(property)
                );
                if (!sameKey || !overlap) continue;
                if (base.token.parsed.raw === callSite.parsed.raw) continue;
                const winner = overlapWinner(callSite, base.token);
                const callSitePrefix = prefixOf(callSite);
                const basePrefix = prefixOf(base.token);
                const stockOrderWinner =
                  !winner &&
                  callSitePrefix &&
                  basePrefix &&
                  callSitePrefix !== basePrefix
                    ? stockSpacingOrder.indexOf(callSitePrefix) >
                      stockSpacingOrder.indexOf(basePrefix)
                      ? "call site (stock property order)"
                      : "component variant (stock property order)"
                    : undefined;
                const rendered = !winner
                  ? (stockOrderWinner ?? "undetermined (same stock property)")
                  : winner === base.token
                    ? "component variant"
                    : "call site";
                rows.push(
                  `| \`${relative(appRoot, path)}:${site.line}\` | \`${tag}\` | \`${callSite.parsed.raw}\` | \`${base.token.parsed.raw}\` | ${rendered} |`
                );
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  const header = [
    "| Call site | Component | Call-site class | Release 1 component class | Release 1 rendered |",
    "| --- | --- | --- | --- | --- |",
  ];
  const componentRows = [...components].map(
    ([name, classes]) =>
      `- \`${name}\`: ${[...new Set(classes.map((c) => c.token.parsed.raw))].map((c) => `\`${c}\``).join(" ")}`
  );
  return [
    `Release 1 spacing classes on each component's root element (default variants), from \`${releaseOneRevision}\`:`,
    "",
    ...componentRows,
    "",
    ...header,
    ...rows,
  ].join("\n");
};

const main = (): void => {
  const options = parseArguments(process.argv.slice(2));
  const mapping = buildMapping();
  if (options.showMapping) printMapping(mapping);
  if (options.crossFileReport) {
    console.log(crossFileReport(mapping));
    return;
  }
  if (options.directories.length === 0) {
    if (!options.showMapping) {
      throw new Error(
        "Usage: tailwind-semantic.ts [--write] [--mapping] [--usage] [--cross-file-report] <dir...>"
      );
    }
    return;
  }
  const leftover = retiredNamePattern(mapping);
  let totalChanges = 0;
  let filesChanged = 0;
  const skipped: string[] = [];
  const leftovers: string[] = [];
  const orderNotes: string[] = [];
  const dedupes: string[] = [];

  for (const directory of options.directories) {
    for (const file of sourceFilesUnder(directory)) {
      if (/\.test\.tsx?$/.test(file) || file.endsWith("routeTree.gen.ts"))
        continue;
      const source = readFileSync(file, "utf8");
      const result = transformSource(file, source, mapping);
      const shown = relative(appRoot, file);
      if (result.changes.length) {
        filesChanged += 1;
        totalChanges += result.changes.length;
        console.log(`\n${shown} (${result.changes.length} literal(s))`);
        for (const change of result.changes) {
          console.log(
            `  L${change.line}  - ${change.before}\n       + ${change.after}`
          );
          for (const drop of change.dropped) {
            dedupes.push(
              `${shown}:${change.line}  [${drop.domain}] removed \`${drop.removed}\`, kept \`${drop.keptBecause}\` (Release 1 rendered the kept one)`
            );
          }
        }
        if (options.write) writeFileSync(file, result.updated);
      }
      result.orderSensitive.forEach((note) =>
        orderNotes.push(`${shown}:${note.line}  ${note.message}`)
      );
      result.skippedTemplates.forEach((template) =>
        skipped.push(
          `${shown}:${template.line}  ${template.text.replace(/\s+/g, " ")}`
        )
      );
      const remaining = options.write ? result.updated : source;
      const afterSource = result.changes.length ? result.updated : remaining;
      afterSource.split("\n").forEach((line, index) => {
        const matches = line.match(leftover);
        if (matches) {
          leftovers.push(
            `${shown}:${index + 1}  ${matches.join(" ")}  <- ${line.trim().slice(0, 100)}`
          );
        }
      });
    }
  }

  console.log(
    `\n${options.write ? "WROTE" : "DRY RUN"}: ${totalChanges} literal(s) in ${filesChanged} file(s)`
  );
  const section = (title: string, lines: string[]) => {
    console.log(`\n${title} (${lines.length})`);
    lines.forEach((line) => console.log(`  ${line}`));
  };
  section(
    "Conflicts deduped inside a literal / unconditional cn() args",
    dedupes
  );
  section(
    "Order-sensitive partial overlaps (kept both, review by hand)",
    orderNotes
  );
  section("Skipped template literals with substitutions", skipped);
  section(
    "Retired names still present after the run (not in className/cn/cva literals)",
    leftovers
  );
  if (options.usage) runUsage(mapping, options.directories);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
