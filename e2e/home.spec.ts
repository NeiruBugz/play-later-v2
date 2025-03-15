import { test, expect } from '@playwright/test';

test('should load the home page for non-authenticated user', async ({
  page,
}) => {
  await page.goto('/');

  await page.waitForLoadState('networkidle');

  const title = await page.title();
  expect(title).toBeTruthy();

  const signInButton = await page
    .getByRole('button', { name: /sign in with google/i })
    .count();

  expect(signInButton).toBeDefined();

  expect(signInButton).toBeGreaterThan(0);

  await page.screenshot({ path: 'e2e-results/home-page-non-auth.png' });
});
