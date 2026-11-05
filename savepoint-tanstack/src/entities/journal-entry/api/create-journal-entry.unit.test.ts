import { describe, expect, it } from "vitest";

import { ValidationError } from "@/shared/lib/errors";

import { createJournalEntry } from "./create-journal-entry.server";

describe("createJournalEntry — input rules", () => {
  it("rejects a note with neither text nor time", async () => {
    await expect(
      createJournalEntry("user-abc", { content: "   " })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects time without a game with the TIME_NEEDS_GAME code", async () => {
    await expect(
      createJournalEntry("user-abc", { playedMinutes: 30 })
    ).rejects.toMatchObject({
      code: "VALIDATION",
      context: { code: "TIME_NEEDS_GAME" },
    });
  });
});
