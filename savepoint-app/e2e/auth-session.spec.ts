import { expect, test } from "@playwright/test";

import { getSession } from "./helpers/auth";
import { disconnectDatabase } from "./helpers/db";

test.describe("[auth] Session persistence", () => {
  test.afterAll(async () => {
    await disconnectDatabase();
  });
  test.use({ storageState: undefined });

  test("persists across page reloads and navigation", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const sessionBefore: any = await getSession(page);
    expect(sessionBefore?.user?.id).toBeTruthy();

    await page.reload();
    await page.waitForLoadState("networkidle");

    const sessionAfterReload: any = await getSession(page);
    expect(sessionAfterReload?.user?.id).toBeTruthy();

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch("http://localhost:6060/profile/setup");

    const sessionOnDashboard: any = await getSession(page);
    expect(sessionOnDashboard?.user?.id).toBeTruthy();
  });
});
