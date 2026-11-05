import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

export const PHONE_SIZES = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

export const CHECKS = [
  "horizontalScroll",
  "tapSize",
  "fontSize",
  "bodyFontSize",
  "clippedOrCovered",
] as const;

export type CheckName = (typeof CHECKS)[number];

export type Failure = {
  check: CheckName;
  selector: string;
  text?: string;
  box?: { x: number; y: number; width: number; height: number };
  value?: string | number;
};

const verifyUiScripts = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../.claude/skills/verify-ui/scripts"
);
const readVerifyUiScript = (name: string): string =>
  readFileSync(join(verifyUiScripts, name), "utf8");

const checkClickableSource = readVerifyUiScript("check-clickable.js");

declare function checkClickable(options: { selectors: string[] }): {
  results?: Array<{ clickable: boolean; reason: string; blocked_by?: string }>;
  error?: string;
};

// Runs inside the page: it cannot reference anything outside its own body.
function collectPhoneFailures(): Failure[] {
  const MIN_TAP_PX = 44;
  const MIN_FONT_PX = 12;
  const MIN_BODY_FONT_PX = 15;
  const BODY_TEXT_MIN_CHARACTERS = 40;
  const TOLERANCE_PX = 0.5;
  const PROBE_ATTRIBUTE = "data-design-review-probe";

  const INTERACTIVE = [
    "a[href]",
    "button",
    "input:not([type=hidden])",
    "select",
    "textarea",
    "summary",
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="combobox"]',
  ].join(",");

  const NOT_BODY_TEXT = [
    "label",
    "button",
    "nav",
    "th",
    "caption",
    "figcaption",
    "small",
    "time",
    "code",
    "kbd",
    '[role="button"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[data-slot="badge"]',
    '[data-slot="label"]',
  ].join(",");

  const failures: Failure[] = [];

  const devtoolsToggle = document
    .querySelector('img[alt="TanStack Devtools"]')
    ?.closest("button");
  const previousPointerEvents = devtoolsToggle?.style.pointerEvents ?? "";
  if (devtoolsToggle) devtoolsToggle.style.pointerEvents = "none";
  const isDevtools = (el: Element) => !!devtoolsToggle?.contains(el);
  const round = (n: number) => Math.round(n * 10) / 10;

  const dialogs = Array.from(
    document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
  ).filter((d) => d.getBoundingClientRect().height > 0);
  const root: Element = dialogs.at(-1) ?? document.body;

  const boxOf = (el: Element) => {
    const r = el.getBoundingClientRect();
    return {
      x: round(r.left),
      y: round(r.top + window.scrollY),
      width: round(r.width),
      height: round(r.height),
    };
  };

  const textOf = (el: Element) =>
    (el.getAttribute("aria-label") || el.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);

  const isAnchor = (el: Element) =>
    el.hasAttribute("data-testid") ||
    el.hasAttribute("data-slot") ||
    el.hasAttribute("role") ||
    ["MAIN", "NAV", "HEADER", "FOOTER", "FORM"].includes(el.tagName);

  const stableId = (el: Element) =>
    el.id && /^[A-Za-z][\w-]*$/.test(el.id) ? el.id : "";

  const segment = (el: Element, withQualifier: boolean) => {
    const testId = el.getAttribute("data-testid");
    if (testId) return `[data-testid="${testId}"]`;
    const id = stableId(el);
    if (id) return `#${id}`;
    const tag = el.tagName.toLowerCase();
    const slot = el.getAttribute("data-slot");
    const role = el.getAttribute("role");
    let out = slot
      ? `${tag}[data-slot=${slot}]`
      : role
        ? `${tag}[role=${role}]`
        : tag;
    if (!withQualifier) return out;
    const label = el.getAttribute("aria-label");
    if (label) out += `[aria-label="${label.slice(0, 30)}"]`;
    else if (el.tagName === "A") out += `[href="${el.getAttribute("href")}"]`;
    else if (el.getAttribute("name"))
      out += `[name=${el.getAttribute("name")}]`;
    else if (el.getAttribute("type"))
      out += `[type=${el.getAttribute("type")}]`;
    return out;
  };

  const selectorFor = (el: Element) => {
    const parts = [segment(el, true)];
    const own = parts[0] ?? "";
    if (own.startsWith("[data-testid") || own.startsWith("#")) return own;
    let ancestors = 0;
    for (
      let parent = el.parentElement;
      parent && parent !== document.body && ancestors < 3;
      parent = parent.parentElement
    ) {
      if (!isAnchor(parent) && !stableId(parent)) continue;
      parts.unshift(segment(parent, false));
      ancestors++;
      if (parent.hasAttribute("data-testid") || stableId(parent)) break;
    }
    return parts.join(" > ");
  };

  const clipsOverflow = (cs: CSSStyleDeclaration) =>
    cs.overflowX !== "visible" || cs.overflowY !== "visible";

  const isRendered = (el: Element) => {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 1 && rect.height <= 1) return false;
    const own = getComputedStyle(el);
    if (own.display === "none" || own.visibility !== "visible") return false;
    for (
      let node: Element | null = el;
      node && node !== document.documentElement;
      node = node.parentElement
    ) {
      const cs = getComputedStyle(node);
      if (Number(cs.opacity) === 0) return false;
      if (node === el || !clipsOverflow(cs)) continue;
      const clip = node.getBoundingClientRect();
      const outside =
        rect.right <= clip.left ||
        rect.left >= clip.right ||
        rect.bottom <= clip.top ||
        rect.top >= clip.bottom;
      if (outside) return false;
    }
    return true;
  };

  const isDisabled = (el: Element) =>
    el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true";

  const clippedBy = (el: Element): string | null => {
    const rect = el.getBoundingClientRect();
    if (rect.left < -1 || rect.right > window.innerWidth + 1) {
      return "extends beyond the viewport";
    }
    for (
      let node = el.parentElement;
      node && node !== document.documentElement;
      node = node.parentElement
    ) {
      const cs = getComputedStyle(node);
      const hidesX = cs.overflowX === "hidden" || cs.overflowX === "clip";
      const hidesY = cs.overflowY === "hidden" || cs.overflowY === "clip";
      if (!hidesX && !hidesY) continue;
      const clip = node.getBoundingClientRect();
      const cutX =
        hidesX && (rect.left < clip.left - 2 || rect.right > clip.right + 2);
      const cutY =
        hidesY && (rect.top < clip.top - 2 || rect.bottom > clip.bottom + 2);
      if (cutX || cutY) return `clipped by ${segment(node, false)}`;
    }
    return null;
  };

  const scrollWidth = document.scrollingElement?.scrollWidth ?? 0;
  if (scrollWidth > window.innerWidth) {
    failures.push({
      check: "horizontalScroll",
      selector: "html",
      value: `${scrollWidth}>${window.innerWidth}`,
    });
    const culprits = Array.from(document.body.querySelectorAll("*")).filter(
      (el) =>
        el.getBoundingClientRect().right > window.innerWidth + 1 &&
        isRendered(el) &&
        !clippedBy(el)?.startsWith("clipped by")
    );
    const outermost = culprits.filter(
      (el) => !culprits.some((other) => other !== el && other.contains(el))
    );
    for (const el of outermost.slice(0, 5)) {
      failures.push({
        check: "horizontalScroll",
        selector: selectorFor(el),
        text: textOf(el),
        box: boxOf(el),
        value: "wider than viewport",
      });
    }
  }

  const interactive = Array.from(root.querySelectorAll(INTERACTIVE)).filter(
    (el) => isRendered(el) && !isDevtools(el)
  );

  for (const el of interactive) {
    const { width, height } = el.getBoundingClientRect();
    if (
      width < MIN_TAP_PX - TOLERANCE_PX ||
      height < MIN_TAP_PX - TOLERANCE_PX
    ) {
      failures.push({
        check: "tapSize",
        selector: selectorFor(el),
        text: textOf(el),
        box: boxOf(el),
        value: `${round(width)}x${round(height)}`,
      });
    }
  }

  for (const el of interactive) {
    if (isDisabled(el)) continue;
    el.scrollIntoView({ block: "center", inline: "nearest" });
    el.setAttribute(PROBE_ATTRIBUTE, "");
    const verdict = checkClickable({
      selectors: [`[${PROBE_ATTRIBUTE}]`],
    }).results?.[0];
    el.removeAttribute(PROBE_ATTRIBUTE);
    const problem =
      clippedBy(el) ??
      (verdict && !verdict.clickable
        ? verdict.blocked_by
          ? `covered by ${verdict.blocked_by}`
          : verdict.reason
        : null);
    if (problem) {
      failures.push({
        check: "clippedOrCovered",
        selector: selectorFor(el),
        text: textOf(el),
        box: boxOf(el),
        value: problem,
      });
    }
  }
  window.scrollTo(0, 0);
  if (devtoolsToggle)
    devtoolsToggle.style.pointerEvents = previousPointerEvents;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seenParents = new Set<Element>();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent || seenParents.has(parent) || !node.nodeValue?.trim()) continue;
    seenParents.add(parent);
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(parent.tagName))
      continue;
    if (!isRendered(parent) || isDevtools(parent)) continue;
    const size = parseFloat(getComputedStyle(parent).fontSize);
    if (size < MIN_FONT_PX) {
      failures.push({
        check: "fontSize",
        selector: selectorFor(parent),
        text: textOf(parent),
        box: boxOf(parent),
        value: size,
      });
    }
  }

  const directText = (el: Element) =>
    Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.nodeValue ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();

  for (const el of Array.from(root.querySelectorAll("*"))) {
    const text = directText(el);
    if (!text || el.closest(NOT_BODY_TEXT)) continue;
    const isBodyText =
      el.matches("p, li") || text.length >= BODY_TEXT_MIN_CHARACTERS;
    if (!isBodyText || !isRendered(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < MIN_BODY_FONT_PX) {
      failures.push({
        check: "bodyFontSize",
        selector: selectorFor(el),
        text: textOf(el),
        box: boxOf(el),
        value: size,
      });
    }
  }

  return failures;
}

export type ScreenWidthResult = {
  id: string;
  width: number;
  failures: Failure[];
};

async function settleLayout(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((done) =>
        requestAnimationFrame(() => requestAnimationFrame(() => done()))
      )
  );
  await page.waitForTimeout(150);
}

export async function runPhoneChecks(
  page: Page,
  screenId: string,
  restoreSize: { width: number; height: number }
): Promise<ScreenWidthResult[]> {
  const results: ScreenWidthResult[] = [];
  try {
    for (const size of PHONE_SIZES) {
      await page.setViewportSize(size);
      await settleLayout(page);
      await page.evaluate(checkClickableSource);
      const failures = await page.evaluate(collectPhoneFailures);
      results.push({ id: screenId, width: size.width, failures });
    }
  } finally {
    await page.setViewportSize(restoreSize);
    await settleLayout(page);
  }
  return results;
}

export function summarize(results: ScreenWidthResult[]) {
  const byCheck = Object.fromEntries(CHECKS.map((c) => [c, 0])) as Record<
    CheckName,
    number
  >;
  for (const result of results) {
    for (const failure of result.failures) byCheck[failure.check]++;
  }
  const total = Object.values(byCheck).reduce((a, b) => a + b, 0);
  return { byCheck, total };
}
