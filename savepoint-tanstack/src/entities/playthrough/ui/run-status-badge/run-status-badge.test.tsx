import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { RunStatusBadge } from "./run-status-badge";

const elements = {
  queryLabel: (text: string) => screen.queryByText(text),
  querySvgIcon: () => document.querySelector("svg"),
};

describe("RunStatusBadge", () => {
  describe("given status PLAYING", () => {
    beforeEach(() => {
      render(<RunStatusBadge status="PLAYING" />);
    });

    it('shows the label "Playing"', () => {
      expect(elements.queryLabel("Playing")).not.toBeNull();
    });

    it("renders an svg icon", () => {
      expect(elements.querySvgIcon()).not.toBeNull();
    });
  });

  describe("given status FINISHED", () => {
    beforeEach(() => {
      render(<RunStatusBadge status="FINISHED" />);
    });

    it('shows the label "Finished"', () => {
      expect(elements.queryLabel("Finished")).not.toBeNull();
    });

    it("renders an svg icon", () => {
      expect(elements.querySvgIcon()).not.toBeNull();
    });
  });

  describe("given status ABANDONED", () => {
    beforeEach(() => {
      render(<RunStatusBadge status="ABANDONED" />);
    });

    it('shows the label "Abandoned"', () => {
      expect(elements.queryLabel("Abandoned")).not.toBeNull();
    });

    it("renders an svg icon", () => {
      expect(elements.querySvgIcon()).not.toBeNull();
    });
  });
});
