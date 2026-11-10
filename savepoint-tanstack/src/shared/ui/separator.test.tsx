import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Separator } from "./separator";

const elements = {
  querySeparator: () => screen.queryByRole("separator"),
};

describe("Separator", () => {
  describe("given default props (decorative=true)", () => {
    beforeEach(() => {
      render(<Separator />);
    });

    it("suppresses the separator role when decorative", () => {
      // Radix sets role="none" (not "separator") for decorative separators
      expect(elements.querySeparator()).toBeNull();
    });
  });

  describe("given decorative=false", () => {
    beforeEach(() => {
      render(<Separator decorative={false} />);
    });

    it("renders with role='separator'", () => {
      expect(elements.querySeparator()).not.toBeNull();
    });
  });

  describe("given orientation='horizontal' and decorative=false", () => {
    beforeEach(() => {
      render(<Separator orientation="horizontal" decorative={false} />);
    });

    it("renders with aria-orientation='horizontal'", () => {
      expect(elements.querySeparator()).toHaveAttribute(
        "aria-orientation",
        "horizontal"
      );
    });
  });

  describe("given orientation='vertical' and decorative=false", () => {
    beforeEach(() => {
      render(<Separator orientation="vertical" decorative={false} />);
    });

    it("renders with aria-orientation='vertical'", () => {
      expect(elements.querySeparator()).toHaveAttribute(
        "aria-orientation",
        "vertical"
      );
    });
  });

  // jsdom computes no layout, so the sizing classes are asserted against the
  // orientation attribute Base UI emits; real layout is verified in the browser.
  describe("given orientation='horizontal'", () => {
    beforeEach(() => {
      render(<Separator orientation="horizontal" decorative={false} />);
    });

    it("emits data-orientation=horizontal", () => {
      expect(elements.querySeparator()).toHaveAttribute(
        "data-orientation",
        "horizontal"
      );
    });

    it("draws a full-width hairline via the emitted attribute", () => {
      expect(elements.querySeparator()).toHaveClass(
        "data-[orientation=horizontal]:h-px",
        "data-[orientation=horizontal]:w-full"
      );
    });
  });

  describe("given orientation='vertical'", () => {
    beforeEach(() => {
      render(<Separator orientation="vertical" decorative={false} />);
    });

    it("emits data-orientation=vertical", () => {
      expect(elements.querySeparator()).toHaveAttribute(
        "data-orientation",
        "vertical"
      );
    });

    it("draws a stretched vertical hairline via the emitted attribute", () => {
      expect(elements.querySeparator()).toHaveClass(
        "data-[orientation=vertical]:w-px",
        "data-[orientation=vertical]:self-stretch"
      );
    });
  });
});
