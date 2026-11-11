import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StatusControl } from "./status-control";

vi.mock("@/shared/lib/use-media-query", () => ({ useIsDesktop: () => true }));

const onChange = vi.fn();

const elements = {
  getPill: (label: string) =>
    screen.getByRole("button", { name: `Status: ${label}. Change` }),
  getOption: (name: string) => screen.getByRole("radio", { name }),
  queryGroup: () => screen.queryByRole("radiogroup"),
};

describe("StatusControl", () => {
  describe("given a Done item with an outcome and showDoneOutcome", () => {
    it("reads the outcome in the chip text", () => {
      render(
        <StatusControl
          status="DONE"
          outcome="LET_GO"
          showDoneOutcome
          onChange={onChange}
        />
      );
      expect(elements.getPill("Done")).toHaveTextContent("Done · Let go");
    });
  });

  describe("given a Done item with an outcome and no showDoneOutcome", () => {
    it("keeps the plain Let go chip", () => {
      render(
        <StatusControl status="DONE" outcome="LET_GO" onChange={onChange} />
      );
      expect(elements.getPill("Done")).toHaveTextContent(/^Let go$/);
    });
  });

  beforeEach(() => {
    onChange.mockClear();
  });

  describe("given a Playing item", () => {
    beforeEach(() => {
      render(<StatusControl status="PLAYING" onChange={onChange} />);
    });

    it("shows the title-case label in an accessible pill", () => {
      expect(elements.getPill("Playing")).toHaveTextContent("Playing");
    });

    it("opens the picker with the current status checked when clicked", async () => {
      await userEvent.click(elements.getPill("Playing"));
      expect(elements.getOption("Playing")).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });

    it("reports the chosen status", async () => {
      await userEvent.click(elements.getPill("Playing"));
      await userEvent.click(elements.getOption("Done"));
      expect(onChange).toHaveBeenCalledExactlyOnceWith("DONE");
      expect(elements.queryGroup()).not.toBeInTheDocument();
    });
  });

  describe("given a Done item that was let go", () => {
    beforeEach(() => {
      render(
        <StatusControl status="DONE" outcome="LET_GO" onChange={onChange} />
      );
    });

    it("shows the Let go chip in the Done variant", () => {
      const chip = screen.getByText("Let go");
      expect(chip).toHaveAttribute("data-status", "let-go");
      expect(chip).toHaveAttribute("data-variant", "done");
    });
  });

  describe("given it is disabled", () => {
    beforeEach(async () => {
      render(<StatusControl status="WANT" onChange={onChange} disabled />);
      await userEvent.click(elements.getPill("Want"));
    });

    it("does not open the picker", () => {
      expect(elements.queryGroup()).not.toBeInTheDocument();
    });
  });
});
