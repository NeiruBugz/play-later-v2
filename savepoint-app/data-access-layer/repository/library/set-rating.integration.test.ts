import {
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

import { NotFoundError } from "@/shared/lib/errors";

import { setRating } from "./library-repository";

describe("LibraryRepository.setRating - Integration", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("sets a rating on an unrated entry", async () => {
    const user = await createUser();
    const game = await createGame({ title: "Hollow Knight" });
    const item = await createLibraryItem({ userId: user.id, gameId: game.id });
    expect(item.rating).toBeNull();

    await setRating({
      libraryItemId: item.id,
      userId: user.id,
      rating: 8,
    });

    const updated = await getTestDatabase().libraryItem.findUnique({
      where: { id: item.id },
    });
    expect(updated?.rating).toBe(8);
  });

  it("updates an existing rating", async () => {
    const user = await createUser();
    const game = await createGame({ title: "Celeste" });
    const item = await createLibraryItem({ userId: user.id, gameId: game.id });
    await setRating({
      libraryItemId: item.id,
      userId: user.id,
      rating: 4,
    });

    await setRating({
      libraryItemId: item.id,
      userId: user.id,
      rating: 10,
    });

    const updated = await getTestDatabase().libraryItem.findUnique({
      where: { id: item.id },
    });
    expect(updated?.rating).toBe(10);
  });

  it("clears a rating when given null", async () => {
    const user = await createUser();
    const game = await createGame({ title: "Stardew Valley" });
    const item = await createLibraryItem({ userId: user.id, gameId: game.id });
    await setRating({
      libraryItemId: item.id,
      userId: user.id,
      rating: 6,
    });

    await setRating({
      libraryItemId: item.id,
      userId: user.id,
      rating: null,
    });

    const updated = await getTestDatabase().libraryItem.findUnique({
      where: { id: item.id },
    });
    expect(updated?.rating).toBeNull();
  });

  it("throws NotFoundError when the library item belongs to a different user", async () => {
    const owner = await createUser();
    const other = await createUser();
    const game = await createGame({ title: "Hades" });
    const item = await createLibraryItem({
      userId: owner.id,
      gameId: game.id,
    });
    await setRating({
      libraryItemId: item.id,
      userId: owner.id,
      rating: 7,
    });

    await expect(
      setRating({
        libraryItemId: item.id,
        userId: other.id,
        rating: 2,
      })
    ).rejects.toThrow(NotFoundError);

    const untouched = await getTestDatabase().libraryItem.findUnique({
      where: { id: item.id },
    });
    expect(untouched?.rating).toBe(7);
  });
});
