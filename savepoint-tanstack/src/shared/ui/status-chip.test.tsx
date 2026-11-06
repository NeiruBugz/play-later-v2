import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { STATUS_VARIANTS_WITH_CONTRAST_CHECK } from "./contrast-status-variants";
import { StatusChip, type StatusChipStatus } from "./status-chip";

const elements = {
  getChip: (label: string) => screen.getByText(label),
  getChipVariant: (label: string) =>
    elements.getChip(label).getAttribute("data-variant"),
};

const LABEL_BY_STATUS: Record<StatusChipStatus, string> = {
  want: "Want",
  playing: "Playing",
  done: "Done",
  "let-go": "Let go",
};

describe("StatusChip", () => {
  describe.each(Object.entries(LABEL_BY_STATUS))(
    "given status %s",
    (status, label) => {
      beforeEach(() => {
        render(<StatusChip status={status as StatusChipStatus} />);
      });

      it("shows its label", () => {
        expect(elements.getChip(label).textContent).toBe(label);
      });

      it("exposes the status", () => {
        expect(elements.getChip(label)).toHaveAttribute("data-status", status);
      });

      it("exposes a variant whose colours are contrast-checked in Light and Dark", () => {
        expect(STATUS_VARIANTS_WITH_CONTRAST_CHECK).toContain(
          elements.getChipVariant(label)
        );
      });
    }
  );

  describe("given Let go next to Done", () => {
    beforeEach(() => {
      render(
        <>
          <StatusChip status="done" />
          <StatusChip status="let-go" />
        </>
      );
    });

    it("tells Let go apart by status", () => {
      expect(elements.getChip("Let go")).toHaveAttribute(
        "data-status",
        "let-go"
      );
    });

    it("gives Let go the Done variant", () => {
      expect(elements.getChipVariant("Let go")).toBe("done");
    });

    it("gives both chips the same variant", () => {
      expect(elements.getChipVariant("Let go")).toBe(
        elements.getChipVariant("Done")
      );
    });
  });

  describe("given children", () => {
    beforeEach(() => {
      render(
        <StatusChip status="playing">
          <span aria-hidden="true">v</span>
        </StatusChip>
      );
    });

    it("renders them after the label", () => {
      expect(elements.getChip("Playing").textContent).toBe("Playingv");
    });
  });
});
