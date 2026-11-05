import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

import {
  CHECKS,
  PHONE_SIZES,
  runPhoneChecks,
  summarize,
  type ScreenWidthResult,
} from "./phone-checks.ts";
import {
  SCREENS,
  ScreenSkipped,
  type ReviewContext,
  type Screen,
} from "./screens.ts";

type Theme = "light" | "dark";
type Viewport = { name: "phone" | "desktop"; width: number; height: number };

const THEMES: readonly Theme[] = ["light", "dark"];
const PHONE: Viewport = { name: "phone", width: 390, height: 844 };
const DESKTOP: Viewport = { name: "desktop", width: 1440, height: 900 };

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, "../..");
const repoRoot = resolve(appRoot, "..");

const THEME_STORAGE_KEY = "theme";
const WHATS_NEW_STORAGE_KEY = "whatsNewLastSeenVersion";

const { values: args } = parseArgs({
  options: {
    phase: { type: "string" },
    set: { type: "string" },
    desktop: { type: "boolean", default: false },
    checks: { type: "boolean", default: false },
    out: { type: "string" },
    "base-url": { type: "string", default: "http://localhost:6060" },
  },
});

function fail(message: string): never {
  console.error(`design-review: ${message}`);
  process.exit(1);
}

if (!args.phase) fail("--phase <phase1|phase2> is required");
if (!args.set) fail("--set <before|after> is required");

const email = process.env.REVIEW_EMAIL;
const password = process.env.REVIEW_PASSWORD;

const baseURL = args["base-url"] as string;
const outDir = resolve(
  args.out ??
    join(repoRoot, "context/spec/027-design-reset/review", args.phase, args.set)
);

const checksEnabled =
  args.checks || args.set === "before" || args.set === "after";

const currentWhatsNewVersion = (): string => {
  const config = readFileSync(
    join(appRoot, "src/features/whats-new/config.ts"),
    "utf8"
  );
  const match = /CURRENT_VERSION\s*=\s*"([^"]+)"/.exec(config);
  return match?.[1] ?? "";
};

async function newContext(
  browser: Browser,
  viewport: Viewport,
  theme: Theme,
  whatsNewVersion: string
): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: theme,
    deviceScaleFactor: 2,
  });
  context.setDefaultTimeout(10_000);
  await context.addInitScript(
    ([themeKey, theme, whatsNewKey, version]) => {
      try {
        window.localStorage.setItem(themeKey, theme);
        window.localStorage.setItem(whatsNewKey, version);
      } catch {
        // storage unavailable: the page falls back to the device setting
      }
    },
    [THEME_STORAGE_KEY, theme, WHATS_NEW_STORAGE_KEY, whatsNewVersion]
  );
  return context;
}

async function signIn(context: BrowserContext): Promise<void> {
  const response = await context.request.post("/api/auth/sign-in/email", {
    headers: { Origin: baseURL },
    data: { email, password },
  });
  if (!response.ok()) {
    fail(
      `sign-in failed (${response.status()}). Check REVIEW_EMAIL/REVIEW_PASSWORD and that AUTH_ENABLE_CREDENTIALS=true.`
    );
  }
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

// One-time, server-driven notice (acknowledged once per account). It would
// otherwise cover the first screens of the first run.
async function acknowledgeStatusModelNotice(page: Page): Promise<void> {
  await page.goto("/dashboard");
  await settle(page);
  const gotIt = page
    .getByRole("dialog", { name: "Your library has three statuses now" })
    .getByRole("button", { name: "Got it" });
  if (await gotIt.isVisible()) {
    await gotIt.click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
}

async function discoverContext(page: Page): Promise<ReviewContext> {
  await acknowledgeStatusModelNotice(page);
  await page.goto("/profile");
  const username = new URL(page.url()).pathname.split("/")[2] ?? "";

  await page.goto("/library");
  await settle(page);
  const librarySlugs = await page
    .locator('a[href^="/games/"]')
    .evaluateAll((links) =>
      links
        .map((a) => (a.getAttribute("href") ?? "").replace("/games/", ""))
        .filter((slug) => slug && !slug.startsWith("search"))
    );

  await page.goto("/journal");
  await settle(page);
  const headingId = await page
    .locator('[id^="journal-entry-"][id$="-heading"]')
    .first()
    .getAttribute("id")
    .catch(() => null);
  const entryId = /^journal-entry-(.+)-heading$/.exec(headingId ?? "")?.[1];
  const journalEntryPath = entryId ? `/journal/${entryId}` : null;

  return {
    username,
    otherUsername: process.env.REVIEW_OTHER_USERNAME ?? "audit_friend",
    librarySlugs,
    journalEntryPath,
  };
}

type ScreenResult = {
  id: string;
  status: "captured" | "skipped" | "failed";
  detail?: string;
};

type ScreenHook = (
  page: Page,
  screen: Screen,
  viewport: Viewport,
  theme: Theme
) => Promise<void>;

// Per-screen hooks run after the page has settled and before the screenshot
// is written. The phone checks register here.
const screenHooks: ScreenHook[] = [];

const phoneCheckResults: ScreenWidthResult[] = [];

if (checksEnabled) {
  screenHooks.push(async (page, screen, viewport, theme) => {
    if (viewport.name !== "phone" || theme !== "light") return;
    phoneCheckResults.push(...(await runPhoneChecks(page, screen.id, PHONE)));
  });
}

async function writeReport(): Promise<void> {
  const summary = summarize(phoneCheckResults);
  await mkdir(outDir, { recursive: true });
  await writeFile(
    join(outDir, "report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: baseURL,
        widths: PHONE_SIZES.map((size) => size.width),
        screens: phoneCheckResults,
        summary,
      },
      null,
      2
    )
  );
  for (const check of CHECKS) {
    const failing = phoneCheckResults.filter((r) =>
      r.failures.some((f) => f.check === check)
    ).length;
    console.log(
      `check ${check}: ${summary.byCheck[check]} failures on ${failing}/${phoneCheckResults.length} screen-widths`
    );
  }
  console.log(
    `checks total: ${summary.total} failures -> ${join(outDir, "report.json")}`
  );
}

async function captureScreen(
  page: Page,
  screen: Screen,
  ctx: ReviewContext,
  viewport: Viewport,
  theme: Theme
): Promise<ScreenResult> {
  if (screen.skip)
    return { id: screen.id, status: "skipped", detail: screen.skip };
  try {
    if (screen.open) await screen.open(page, ctx);
    else if (screen.path) await page.goto(screen.path);
    await settle(page);
    for (const hook of screenHooks) await hook(page, screen, viewport, theme);
    const dir = join(outDir, viewport.name);
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: join(dir, `${screen.id}-${theme}.png`),
      fullPage: true,
    });
    return { id: screen.id, status: "captured" };
  } catch (error) {
    if (error instanceof ScreenSkipped) {
      return { id: screen.id, status: "skipped", detail: error.message };
    }
    const detail =
      error instanceof Error ? error.message.split("\n")[0] : String(error);
    return { id: screen.id, status: "failed", detail };
  }
}

async function main(): Promise<void> {
  const needsAuth = SCREENS.some((s) => s.auth && !s.skip);
  const credentialsMissing = !email || !password;
  if (needsAuth && credentialsMissing) {
    fail(
      "REVIEW_EMAIL and REVIEW_PASSWORD must be set (local credentials-provider account, e.g. the seeded audit_full user)."
    );
  }

  const viewports = args.desktop ? [PHONE, DESKTOP] : [PHONE];
  const whatsNewVersion = currentWhatsNewVersion();
  const browser = await chromium.launch();
  const results: Array<ScreenResult & { viewport: string; theme: Theme }> = [];

  try {
    for (const viewport of viewports) {
      for (const theme of THEMES) {
        const authed = await newContext(
          browser,
          viewport,
          theme,
          whatsNewVersion
        );
        const anon = await newContext(
          browser,
          viewport,
          theme,
          whatsNewVersion
        );
        await signIn(authed);
        const authedPage = await authed.newPage();
        const anonPage = await anon.newPage();
        const ctx = await discoverContext(authedPage);

        for (const screen of SCREENS) {
          const page = screen.auth ? authedPage : anonPage;
          const result = await captureScreen(
            page,
            screen,
            ctx,
            viewport,
            theme
          );
          results.push({ ...result, viewport: viewport.name, theme });
          console.log(
            `${viewport.name} ${theme} ${screen.id}: ${result.status}${result.detail ? ` (${result.detail})` : ""}`
          );
        }
        await authed.close();
        await anon.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (checksEnabled) await writeReport();

  const failed = results.filter((r) => r.status === "failed").length;
  console.log(
    `done: ${results.length - failed} ok/skipped, ${failed} failed -> ${outDir}`
  );
  if (failed > 0) process.exitCode = 1;
}

await main();
