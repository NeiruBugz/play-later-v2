/**
 * RED unit test for syncFailureMessage (spec 030 functional 2.6, tech 2.7).
 *
 * Contract:
 *   - `features/storefront-sync/lib/failure-copy.ts` exports
 *     `syncFailureMessage(code: ImportFailureCode | null): string`, the single
 *     map from a failed sync's code to the sentence shown to the person (the
 *     failure alert on the import page and the "Steam sync failed" toast).
 *   - The four codes the spec words are pinned verbatim (2.6.1, 2.6.2, 2.6.4).
 *     START_FAILED, UNKNOWN and a missing code (null) have no spec copy; the
 *     lines below are the pinned generic wording.
 *   - Re-exported from `features/storefront-sync/lib/index.ts`.
 */
import { describe, expect, it } from "vitest";

import { syncFailureMessage } from "./failure-copy";

const copyByCode = [
  {
    code: "PROFILE_PRIVATE",
    message:
      "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again.",
  },
  {
    code: "STEAM_UNAVAILABLE",
    message: "Steam is temporarily unavailable. Please try again later.",
  },
  {
    code: "RATE_LIMITED",
    message: "Too many requests to Steam. Please wait a moment and try again.",
  },
  {
    code: "STALLED",
    message: "Steam sync stopped unexpectedly. Please sync again.",
  },
  {
    code: "START_FAILED",
    message: "Steam sync couldn't start. Please try again.",
  },
  { code: "UNKNOWN", message: "Steam sync failed. Please try again." },
  { code: null, message: "Steam sync failed. Please try again." },
] as const;

describe("syncFailureMessage", () => {
  describe.each(copyByCode)(
    "given the failure code $code",
    ({ code, message }) => {
      it("explains it in the pinned words", () => {
        expect(syncFailureMessage(code)).toBe(message);
      });
    }
  );
});
