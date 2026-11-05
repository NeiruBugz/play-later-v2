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
