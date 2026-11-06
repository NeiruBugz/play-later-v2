import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PRODUCT_NAME } from "@/shared/config/site";

import { LogoMark, LogoWordmark } from "./logo";

const elements = {
  getProductName: () => screen.getByText(PRODUCT_NAME),
  isMarkHidden: () =>
    screen.getByTestId("logo-mark").getAttribute("aria-hidden") === "true",
};

describe("LogoWordmark", () => {
  describe("given it is rendered", () => {
    beforeEach(() => {
      render(<LogoWordmark />);
    });

    it("shows the product name as text", () => {
      expect(elements.getProductName()).toBeDefined();
    });

    it("hides the mark from assistive tech", () => {
      expect(elements.isMarkHidden()).toBe(true);
    });
  });
});

describe("LogoMark", () => {
  describe("given it is rendered alone", () => {
    it("is hidden from assistive tech", () => {
      render(<LogoMark />);
      expect(elements.isMarkHidden()).toBe(true);
    });
  });
});
