import { LibraryItemStatus } from "@/shared/types";

import {
  getPrimaryCtaPayload,
  type CtaPayload,
} from "./library-card-cta-payload";

const ALL_STATUSES = Object.values(LibraryItemStatus) as LibraryItemStatus[];

describe("getPrimaryCtaPayload", () => {
  describe("PLAYING status", () => {
    it.each([true, false])(
      "returns Log Session / logSession regardless of hasBeenPlayed=%s",
      (hasBeenPlayed) => {
        const payload = getPrimaryCtaPayload(
          LibraryItemStatus.PLAYING,
          hasBeenPlayed
        );
        expect(payload.label).toBe("Log Session");
        expect(payload.action.kind).toBe("logSession");
      }
    );
  });

  describe("UP_NEXT status", () => {
    it.each([true, false])(
      "returns Start Playing / updateStatus PLAYING with startedAtNullableSet regardless of hasBeenPlayed=%s",
      (hasBeenPlayed) => {
        const payload = getPrimaryCtaPayload(
          LibraryItemStatus.UP_NEXT,
          hasBeenPlayed
        );
        expect(payload.label).toBe("Start Playing");
        expect(payload.action).toMatchObject({
          kind: "updateStatus",
          status: LibraryItemStatus.PLAYING,
          startedAtNullableSet: true,
        });
      }
    );
  });

  describe("SHELF status", () => {
    it.each([true, false])(
      "returns Queue It / updateStatus UP_NEXT regardless of hasBeenPlayed=%s",
      (hasBeenPlayed) => {
        const payload = getPrimaryCtaPayload(
          LibraryItemStatus.SHELF,
          hasBeenPlayed
        );
        expect(payload.label).toBe("Queue It");
        expect(payload.action).toMatchObject({
          kind: "updateStatus",
          status: LibraryItemStatus.UP_NEXT,
        });
      }
    );

    it("does not set startedAtNullableSet for SHELF", () => {
      const payload = getPrimaryCtaPayload(LibraryItemStatus.SHELF, false);
      if (payload.action.kind === "updateStatus") {
        expect(payload.action.startedAtNullableSet).toBeUndefined();
      }
    });
  });

  describe("PLAYED status", () => {
    it.each([true, false])(
      "returns Replay / updateStatus UP_NEXT with hasBeenPlayed:true regardless of hasBeenPlayed=%s",
      (hasBeenPlayed) => {
        const payload = getPrimaryCtaPayload(
          LibraryItemStatus.PLAYED,
          hasBeenPlayed
        );
        expect(payload.label).toBe("Replay");
        expect(payload.action).toMatchObject({
          kind: "updateStatus",
          status: LibraryItemStatus.UP_NEXT,
          hasBeenPlayed: true,
        });
      }
    );
  });

  describe("WISHLIST status", () => {
    it.each([true, false])(
      "returns Add to Shelf / updateStatus SHELF regardless of hasBeenPlayed=%s",
      (hasBeenPlayed) => {
        const payload = getPrimaryCtaPayload(
          LibraryItemStatus.WISHLIST,
          hasBeenPlayed
        );
        expect(payload.label).toBe("Add to Shelf");
        expect(payload.action).toMatchObject({
          kind: "updateStatus",
          status: LibraryItemStatus.SHELF,
        });
      }
    );
  });

  describe("exhaustive status × hasBeenPlayed matrix", () => {
    it("returns a defined payload for every status × hasBeenPlayed combination", () => {
      for (const status of ALL_STATUSES) {
        for (const hasBeenPlayed of [true, false]) {
          const payload: CtaPayload = getPrimaryCtaPayload(
            status,
            hasBeenPlayed
          );
          expect(payload).toBeDefined();
          expect(typeof payload.label).toBe("string");
          expect(payload.label.length).toBeGreaterThan(0);
          expect(payload.action.kind).toMatch(/^(logSession|updateStatus)$/);
        }
      }
    });
  });
});
