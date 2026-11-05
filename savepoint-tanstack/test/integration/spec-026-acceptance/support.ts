import { vi } from "vitest";

import type { IsolatedDatabase } from "../../setup/isolated-db.ts";

export const SPEC_TAG = "@spec: 026-mindful-core-simplification";

export function pause(ms = 15): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function wipeAllTables(db: IsolatedDatabase): Promise<void> {
  await db.prisma.follow.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
}

export function stubIgdbFor(game: {
  igdbId: number;
  title: string;
  slug: string;
}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      const body = url.includes("id.twitch.tv")
        ? { access_token: "tok", expires_in: 3600, token_type: "bearer" }
        : [
            {
              id: game.igdbId,
              name: game.title,
              slug: game.slug,
              summary: "Summary",
            },
          ];
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => body,
      } as Response);
    })
  );
}
