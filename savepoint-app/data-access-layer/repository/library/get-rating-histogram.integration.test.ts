import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

import { getRatingHistogram } from "./library-repository";

describe("LibraryRepository.getRatingHistogram - Integration", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  it("returns sparse distribution with zeros for missing bins", async () => {
    const user = await createUser();
    const [g1, g2, g3, g4, g5] = await Promise.all([
      createGame({ title: "A" }),
      createGame({ title: "B" }),
      createGame({ title: "C" }),
      createGame({ title: "D" }),
      createGame({ title: "E" }),
    ]);
    await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 3 });
    await createLibraryItem({ userId: user.id, gameId: g2.id, rating: 3 });
    await createLibraryItem({ userId: user.id, gameId: g3.id, rating: 7 });
    await createLibraryItem({ userId: user.id, gameId: g4.id, rating: 10 });
    await createLibraryItem({ userId: user.id, gameId: g5.id, rating: null });

    const histogram = await getRatingHistogram({ userId: user.id });

    expect(histogram).toHaveLength(10);
    const byRating = Object.fromEntries(
      histogram.map((b) => [b.rating, b.count])
    );
    expect(byRating[1]).toBe(0);
    expect(byRating[2]).toBe(0);
    expect(byRating[3]).toBe(2);
    expect(byRating[4]).toBe(0);
    expect(byRating[5]).toBe(0);
    expect(byRating[6]).toBe(0);
    expect(byRating[7]).toBe(1);
    expect(byRating[8]).toBe(0);
    expect(byRating[9]).toBe(0);
    expect(byRating[10]).toBe(1);
    expect(histogram.map((b) => b.rating)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("returns dense distribution with counts across all 10 bins", async () => {
    const user = await createUser();
    const games = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        createGame({ title: `Game ${i + 1}` })
      )
    );
    for (let rating = 1; rating <= 10; rating++) {
      for (let j = 0; j < rating; j++) {
        const extraGame = await createGame({
          title: `Extra ${rating}-${j}`,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: extraGame.id,
          rating,
        });
      }
      await createLibraryItem({
        userId: user.id,
        gameId: games[rating - 1].id,
        rating,
      });
    }

    const histogram = await getRatingHistogram({ userId: user.id });

    expect(histogram).toHaveLength(10);
    for (let rating = 1; rating <= 10; rating++) {
      const bin = histogram.find((b) => b.rating === rating);
      expect(bin?.count).toBe(rating + 1);
    }
  });

  it("returns 10 zero-count bins when user has no rated items", async () => {
    const user = await createUser();
    const game = await createGame({ title: "Unrated" });
    await createLibraryItem({ userId: user.id, gameId: game.id, rating: null });

    const histogram = await getRatingHistogram({ userId: user.id });

    expect(histogram).toHaveLength(10);
    expect(histogram.every((b) => b.count === 0)).toBe(true);
    expect(histogram.map((b) => b.rating)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("does not leak ratings from other users", async () => {
    const owner = await createUser();
    const other = await createUser();
    const [g1, g2] = await Promise.all([
      createGame({ title: "Owned" }),
      createGame({ title: "Other" }),
    ]);
    await createLibraryItem({ userId: owner.id, gameId: g1.id, rating: 5 });
    await createLibraryItem({ userId: other.id, gameId: g2.id, rating: 5 });
    await createLibraryItem({ userId: other.id, gameId: g1.id, rating: 9 });

    const histogram = await getRatingHistogram({ userId: owner.id });

    const byRating = Object.fromEntries(
      histogram.map((b) => [b.rating, b.count])
    );
    expect(byRating[5]).toBe(1);
    expect(byRating[9]).toBe(0);
    const total = histogram.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(1);
  });
});
