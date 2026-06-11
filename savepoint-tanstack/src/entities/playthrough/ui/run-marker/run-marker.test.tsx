import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { RunMarker } from "./run-marker";

const elements = {
  getMarker: () => screen.getByTestId("run-marker"),
  queryHalo: () => screen.queryByTestId("run-marker-halo"),
};

describe("RunMarker", () => {
  describe("given status PLAYING", () => {
    beforeEach(() => {
      render(<RunMarker status="PLAYING" />);
    });

    it("exposes a data-status attribute equal to PLAYING", () => {
      expect(elements.getMarker()).toHaveAttribute("data-status", "PLAYING");
    });

    it("does not render a halo by default", () => {
      expect(elements.queryHalo()).toBeNull();
    });
  });

  describe("given status FINISHED", () => {
    beforeEach(() => {
      render(<RunMarker status="FINISHED" />);
    });

    it("exposes a data-status attribute equal to FINISHED", () => {
      expect(elements.getMarker()).toHaveAttribute("data-status", "FINISHED");
    });
  });

  describe("given status ABANDONED", () => {
    beforeEach(() => {
      render(<RunMarker status="ABANDONED" />);
    });

    it("exposes a data-status attribute equal to ABANDONED", () => {
      expect(elements.getMarker()).toHaveAttribute("data-status", "ABANDONED");
    });
  });

  describe("given ring=true", () => {
    beforeEach(() => {
      render(<RunMarker status="PLAYING" ring />);
    });

    it("renders the halo element", () => {
      expect(elements.queryHalo()).not.toBeNull();
    });
  });

  describe("given ring=false", () => {
    beforeEach(() => {
      render(<RunMarker status="FINISHED" ring={false} />);
    });

    it("does not render the halo element", () => {
      expect(elements.queryHalo()).toBeNull();
    });
  });
});
