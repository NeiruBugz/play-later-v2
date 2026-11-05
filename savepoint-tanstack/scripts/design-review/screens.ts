import type { Locator, Page } from "@playwright/test";

export type ReviewContext = {
  username: string;
  otherUsername: string;
  librarySlugs: string[];
  journalEntryPath: string | null;
};

export class ScreenSkipped extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ScreenSkipped";
  }
}

export type Screen = {
  id: string;
  auth: boolean;
  path?: string;
  open?: (page: Page, ctx: ReviewContext) => Promise<void>;
  skip?: string;
};

// Server-rendered controls do nothing until React hydrates, so an action is
// repeated until its effect shows up.
const repeatUntilVisible = async (
  action: () => Promise<void>,
  effect: Locator,
  attempts = 6
) => {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await action();
    try {
      await effect.waitFor({ state: "visible", timeout: 1500 });
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
    }
  }
};

const OPEN_SEARCH_PALETTE = async (page: Page) => {
  await repeatUntilVisible(
    () => page.keyboard.press("ControlOrMeta+k"),
    page.getByRole("dialog")
  );
};

const gotoGameLinkedFrom = async (
  page: Page,
  listingPath: string,
  pick: (slugs: string[]) => string | undefined
) => {
  await page.goto(listingPath);
  const hrefs = await page
    .locator('a[href^="/games/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  const slugs = hrefs
    .map((href) => href.replace("/games/", "").split(/[?#]/)[0] ?? "")
    .filter((slug) => slug && slug !== "search");
  const slug = pick(slugs);
  if (!slug) throw new ScreenSkipped(`no matching game link on ${listingPath}`);
  await page.goto(`/games/${slug}`);
};

export const SCREENS: Screen[] = [
  { id: "landing", auth: false, path: "/" },
  { id: "sign-in", auth: false, path: "/login" },
  {
    id: "profile-setup",
    auth: true,
    skip: "Reachable only for a user without a username (audit_empty); the review account has a profile, so /profile/setup redirects to /dashboard.",
  },
  { id: "home", auth: true, path: "/dashboard" },
  { id: "library", auth: true, path: "/library" },
  {
    id: "library-empty-filter",
    auth: true,
    path: "/library?platform=review-no-such-platform",
  },
  {
    id: "library-filters-sheet",
    auth: true,
    open: async (page) => {
      await page.goto("/library");
      const filters = page.getByRole("button", { name: "Open filters" });
      await repeatUntilVisible(() => filters.click(), page.getByRole("dialog"));
    },
  },
  {
    id: "library-remove-confirm",
    auth: true,
    open: async (page) => {
      await page.goto("/library");
      const menu = page.getByRole("button", { name: /^Actions for / }).first();
      await menu.waitFor({ state: "visible" });
      const removeItem = page.getByRole("menuitem", {
        name: "Remove from Library",
      });
      await repeatUntilVisible(() => menu.click(), removeItem);
      await removeItem.click();
      await page
        .getByRole("alertdialog")
        .or(page.getByRole("dialog"))
        .waitFor();
    },
  },
  {
    id: "game-in-library",
    auth: true,
    open: (page, ctx) =>
      gotoGameLinkedFrom(page, "/library", () => ctx.librarySlugs[0]),
  },
  {
    id: "game-not-in-library",
    auth: true,
    open: (page, ctx) =>
      gotoGameLinkedFrom(page, `/u/${ctx.otherUsername}`, (slugs) =>
        slugs.find((slug) => !ctx.librarySlugs.includes(slug))
      ),
  },
  { id: "journal-list", auth: true, path: "/journal" },
  {
    id: "journal-entry",
    auth: true,
    open: async (page, ctx) => {
      if (!ctx.journalEntryPath) throw new ScreenSkipped("no journal entries");
      await page.goto(ctx.journalEntryPath);
    },
  },
  { id: "journal-compose", auth: true, path: "/journal/new" },
  {
    id: "journal-edit",
    auth: true,
    open: async (page, ctx) => {
      if (!ctx.journalEntryPath) throw new ScreenSkipped("no journal entries");
      await page.goto(`${ctx.journalEntryPath}/edit`);
    },
  },
  {
    id: "profile-own",
    auth: true,
    open: async (page, ctx) => {
      await page.goto(`/u/${ctx.username}`);
    },
  },
  {
    id: "profile-public",
    auth: false,
    open: async (page, ctx) => {
      await page.goto(`/u/${ctx.otherUsername}`);
    },
  },
  {
    id: "followers",
    auth: true,
    open: async (page, ctx) => {
      await page.goto(`/u/${ctx.username}/followers`);
    },
  },
  {
    id: "following",
    auth: true,
    open: async (page, ctx) => {
      await page.goto(`/u/${ctx.username}/following`);
    },
  },
  { id: "settings-profile", auth: true, path: "/settings/profile" },
  { id: "settings-account", auth: true, path: "/settings/account" },
  { id: "search-results", auth: true, path: "/games/search?q=zelda" },
  {
    id: "quick-search",
    auth: true,
    open: async (page) => {
      await page.goto("/dashboard");
      await OPEN_SEARCH_PALETTE(page);
    },
  },
  { id: "add-game-sheet", auth: true, path: "/dashboard?action=add-game" },
  {
    id: "log-session-sheet",
    auth: true,
    path: "/dashboard?action=log-session",
  },
  {
    id: "not-found",
    auth: false,
    path: "/review-no-such-page",
  },
  {
    id: "loading-state",
    auth: true,
    skip: "Loading skeletons are transient; no deterministic hook to freeze them with seeded data.",
  },
  {
    id: "error-state",
    auth: true,
    skip: "Error states need a forced server failure; not reachable with seeded data.",
  },
];
