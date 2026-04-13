import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

import { findLibraryItemsWithFilters } from "./library-repository";

describe("LibraryRepository - Rating filters and sorting", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("minRating filter", () => {
    it("returns only entries with rating >= minRating", async () => {
      const user = await createUser();
      const [g1, g2, g3, g4] = await Promise.all([
        createGame({ title: "Low" }),
        createGame({ title: "Mid" }),
        createGame({ title: "High" }),
        createGame({ title: "Unrated" }),
      ]);

      await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 3 });
      await createLibraryItem({ userId: user.id, gameId: g2.id, rating: 5 });
      await createLibraryItem({ userId: user.id, gameId: g3.id, rating: 9 });
      await createLibraryItem({ userId: user.id, gameId: g4.id, rating: null });

      const result = await findLibraryItemsWithFilters({
        userId: user.id,
        minRating: 5,
      });

      expect(result.total).toBe(2);
      const titles = result.items.map((i) => i.game.title).sort();
      expect(titles).toEqual(["High", "Mid"]);
      expect(result.items.every((i) => (i.rating ?? 0) >= 5)).toBe(true);
    });
  });

  describe("unratedOnly filter", () => {
    it("returns only entries with null rating", async () => {
      const user = await createUser();
      const [g1, g2, g3] = await Promise.all([
        createGame({ title: "Rated A" }),
        createGame({ title: "Unrated" }),
        createGame({ title: "Rated B" }),
      ]);

      await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 7 });
      await createLibraryItem({ userId: user.id, gameId: g2.id, rating: null });
      await createLibraryItem({ userId: user.id, gameId: g3.id, rating: 2 });

      const result = await findLibraryItemsWithFilters({
        userId: user.id,
        unratedOnly: true,
      });

      expect(result.total).toBe(1);
      expect(result.items[0].rating).toBeNull();
      expect(result.items[0].game.title).toBe("Unrated");
    });
  });

  describe("sort: rating-desc", () => {
    it("orders rated items desc with NULLS LAST", async () => {
      const user = await createUser();
      const [g1, g2, g3, g4] = await Promise.all([
        createGame({ title: "G1" }),
        createGame({ title: "G2" }),
        createGame({ title: "G3" }),
        createGame({ title: "G4" }),
      ]);

      await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 3 });
      await createLibraryItem({ userId: user.id, gameId: g2.id, rating: null });
      await createLibraryItem({ userId: user.id, gameId: g3.id, rating: 9 });
      await createLibraryItem({ userId: user.id, gameId: g4.id, rating: 6 });

      const result = await findLibraryItemsWithFilters({
        userId: user.id,
        sortBy: "rating-desc",
      });

      expect(result.items.map((i) => i.rating)).toEqual([9, 6, 3, null]);
    });
  });

  describe("sort: rating-asc", () => {
    it("orders rated items asc with NULLS LAST", async () => {
      const user = await createUser();
      const [g1, g2, g3, g4] = await Promise.all([
        createGame({ title: "G1" }),
        createGame({ title: "G2" }),
        createGame({ title: "G3" }),
        createGame({ title: "G4" }),
      ]);

      await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 3 });
      await createLibraryItem({ userId: user.id, gameId: g2.id, rating: null });
      await createLibraryItem({ userId: user.id, gameId: g3.id, rating: 9 });
      await createLibraryItem({ userId: user.id, gameId: g4.id, rating: 6 });

      const result = await findLibraryItemsWithFilters({
        userId: user.id,
        sortBy: "rating-asc",
      });

      expect(result.items.map((i) => i.rating)).toEqual([3, 6, 9, null]);
    });
  });

  describe("precedence: unratedOnly wins over minRating", () => {
    it("returns only null-rated rows when both unratedOnly=true and minRating=5 are passed (service-layer precedence rule: unratedOnly wins; the service should pass unratedOnly and drop minRating, but the repository also defensively enforces unratedOnly precedence)", async () => {
      const user = await createUser();
      const [g1, g2, g3] = await Promise.all([
        createGame({ title: "High rated" }),
        createGame({ title: "Unrated A" }),
        createGame({ title: "Unrated B" }),
      ]);

      await createLibraryItem({ userId: user.id, gameId: g1.id, rating: 10 });
      await createLibraryItem({ userId: user.id, gameId: g2.id, rating: null });
      await createLibraryItem({ userId: user.id, gameId: g3.id, rating: null });

      const result = await findLibraryItemsWithFilters({
        userId: user.id,
        unratedOnly: true,
        minRating: 5,
      });

      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.rating === null)).toBe(true);
    });
  });
});
