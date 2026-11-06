import { describe, expect, it } from "vitest";

import { toStatusChipStatus } from "./status-chip";

describe("toStatusChipStatus", () => {
  it.each([
    ["WANT", "want"],
    ["PLAYING", "playing"],
    ["DONE", "done"],
  ] as const)("maps %s to %s", (status, chip) => {
    expect(toStatusChipStatus(status)).toBe(chip);
  });

  it("maps Done with the Let go outcome to let-go", () => {
    expect(toStatusChipStatus("DONE", "LET_GO")).toBe("let-go");
  });

  it("keeps Done with the Finished outcome or no outcome as done", () => {
    expect(toStatusChipStatus("DONE", "FINISHED")).toBe("done");
    expect(toStatusChipStatus("DONE", null)).toBe("done");
  });

  it("ignores a stale outcome on a game that is no longer Done", () => {
    expect(toStatusChipStatus("PLAYING", "LET_GO")).toBe("playing");
    expect(toStatusChipStatus("WANT", "LET_GO")).toBe("want");
  });
});
