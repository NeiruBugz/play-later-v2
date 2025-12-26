import { expect, test } from "@playwright/test";

import {
  cleanupUserTestData,
  createTestGame,
  createTestJournalEntry,
  createTestLibraryItem,
  deleteTestJournalEntries,
  disconnectDatabase,
  getUserByEmail,
  type TestGame,
  type TestJournalEntry,
  type TestLibraryItem,
} from "./helpers/db";
import { JournalPage } from "./pages/journal.page";

const AUTH_USER_EMAIL = "e2e-auth-user@example.com";

test.describe("[journal] Journal Empty State", () => {
  let userId: string;

  test.beforeAll(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) {
      throw new Error("Auth user not found");
    }
    userId = user.id;
  });

  test.beforeEach(async () => {
    await cleanupUserTestData(userId);
  });

  test.afterAll(async () => {
    await cleanupUserTestData(userId);
    await disconnectDatabase();
  });

  test("displays empty state when no entries exist", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.goto();

    await expect(journal.heading()).toHaveText("My Journal");
    await expect(journal.emptyStateText()).toBeVisible();
    await expect(journal.writeFirstEntryButton()).toBeVisible();
  });

  test("navigates to new entry page from empty state", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.goto();

    await journal.writeFirstEntryButton().click();
    await page.waitForURL("/journal/new");

    await expect(journal.heading()).toHaveText("Write New Entry");
  });
});

test.describe("[journal] Journal With Entries", () => {
  let testGame: TestGame;
  let testLibraryItem: TestLibraryItem;
  let testEntry: TestJournalEntry;
  let userId: string;

  test.beforeEach(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) {
      throw new Error("Auth user not found");
    }
    userId = user.id;

    await cleanupUserTestData(userId);

    testGame = await createTestGame({
      title: "Test Game for Journal",
      igdbId: 999001,
      slug: "test-game-journal",
    });

    testLibraryItem = await createTestLibraryItem({
      userId,
      gameId: testGame.id,
      status: "PLAYING",
    });

    testEntry = await createTestJournalEntry({
      userId,
      gameId: testGame.id,
      libraryItemId: testLibraryItem.id,
      title: "My First Entry",
      content: "This is my test journal entry content.",
      playSession: 5,
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserTestData(userId);
    }
    await disconnectDatabase();
  });

  test("displays journal entries list", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.goto();

    await expect(journal.heading()).toHaveText("My Journal");
    await expect(journal.journalEntriesHeading()).toBeVisible();
    await expect(journal.writeNewEntryButton()).toBeVisible();
    await expect(journal.entryCard("My First Entry")).toBeVisible();
  });

  test("navigates to entry detail page", async ({ page }) => {
    const journal = new JournalPage(page);

    await journal.gotoEntry(testEntry.id);

    await expect(journal.entryTitle()).toHaveText("My First Entry");
    await expect(journal.entryContent()).toContainText(
      "This is my test journal entry content."
    );
    await expect(journal.hoursPlayedText()).toContainText("5 hours");
  });

  test("navigates to edit page and updates entry", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoEntry(testEntry.id);

    await expect(journal.entryTitle()).toHaveText("My First Entry");

    await journal.editButton().click();
    await page.waitForURL(/\/journal\/[a-z0-9-]+\/edit$/);

    await expect(journal.heading()).toHaveText("Edit Journal Entry");

    await journal.titleInput().clear();
    await journal.titleInput().fill("Updated Entry Title");
    await journal.contentTextarea().clear();
    await journal.contentTextarea().fill("Updated content for the entry.");

    await journal.submitEditEntry();

    await expect(journal.entryTitle()).toHaveText("Updated Entry Title");
    await expect(journal.entryContent()).toContainText(
      "Updated content for the entry."
    );
  });

  test("can cancel edit without saving changes", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoEntry(testEntry.id);

    await journal.editButton().click();
    await page.waitForURL(/\/journal\/[a-z0-9-]+\/edit$/);

    await journal.titleInput().clear();
    await journal.titleInput().fill("This should not be saved");

    await journal.cancelButton().click();
    await page.waitForURL(/\/journal\/[a-z0-9-]+$/);

    await expect(journal.entryTitle()).toHaveText("My First Entry");
  });

  test("shows delete confirmation dialog", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoEntry(testEntry.id);

    await journal.deleteButton().click();

    await expect(journal.deleteDialog()).toBeVisible();
    await expect(journal.deleteDialogTitle()).toBeVisible();
    await expect(journal.confirmDeleteButton()).toBeVisible();
    await expect(journal.cancelDeleteButton()).toBeVisible();
  });

  test("can cancel delete operation", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoEntry(testEntry.id);

    await journal.deleteButton().click();
    await expect(journal.deleteDialog()).toBeVisible();

    await journal.cancelDeleteButton().click();
    await expect(journal.deleteDialog()).not.toBeVisible();
    await expect(journal.entryTitle()).toHaveText("My First Entry");
  });

  test("deletes entry and redirects to list", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoEntry(testEntry.id);

    await journal.deleteButton().click();
    await expect(journal.deleteDialog()).toBeVisible();

    await journal.confirmDelete();

    await expect(page).toHaveURL("/journal");
  });
});

test.describe("[journal] Create Entry Flow", () => {
  let testGame: TestGame;
  let userId: string;

  test.beforeEach(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) {
      throw new Error("Auth user not found");
    }
    userId = user.id;

    await cleanupUserTestData(userId);

    testGame = await createTestGame({
      title: "Test Game for Create",
      igdbId: 999002,
      slug: "test-game-create",
    });

    await createTestLibraryItem({
      userId,
      gameId: testGame.id,
      status: "PLAYING",
    });
  });

  test.afterAll(async () => {
    if (userId) {
      await cleanupUserTestData(userId);
    }
    await disconnectDatabase();
  });

  test("shows game selector on new entry page", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoNewEntry();

    await expect(journal.heading()).toHaveText("Write New Entry");
    await expect(journal.selectGameHeading()).toBeVisible();
    await expect(journal.gameSearchInput()).toBeVisible();
  });

  test("creates entry with title and content", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoNewEntry();

    await journal.gameButton("Test Game for Create").click();

    await journal.fillEntryForm({
      title: "New Journal Entry",
      content: "This is the content of my new journal entry.",
      hoursPlayed: 3,
    });

    await journal.submitNewEntry();

    await expect(journal.entryTitle()).toHaveText("New Journal Entry");
    await expect(journal.entryContent()).toContainText(
      "This is the content of my new journal entry."
    );
    await expect(journal.hoursPlayedText()).toContainText("3 hours");
  });

  test("creates entry without title", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoNewEntry();

    await journal.gameButton("Test Game for Create").click();

    await journal.fillEntryForm({
      content: "Content without a title.",
    });

    await journal.submitNewEntry();

    await expect(journal.entryContent()).toContainText(
      "Content without a title."
    );
  });

  test("can cancel creating new entry", async ({ page }) => {
    const journal = new JournalPage(page);
    await journal.gotoNewEntry();

    await journal.cancelButton().click();
    await page.waitForURL("/journal");

    await expect(journal.heading()).toHaveText("My Journal");
  });
});
