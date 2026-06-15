import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PlatformPill } from "./platform-pill";

const elements = {
  queryLabel: (text: string) => screen.queryByText(text),
  queryContainer: () => screen.queryByTestId("platform-pill"),
};

describe("PlatformPill", () => {
  describe("given a known platform PS5", () => {
    beforeEach(() => {
      render(<PlatformPill platform="PlayStation 5" />);
    });

    it("renders the abbreviated platform label PS5", () => {
      expect(elements.queryLabel("PS5")).not.toBeNull();
    });
  });

  describe("given a plain platform string", () => {
    beforeEach(() => {
      render(<PlatformPill platform="PC (Microsoft Windows)" />);
    });

    it("renders a visible chip for the platform", () => {
      expect(elements.queryLabel("PC")).not.toBeNull();
    });
  });

  describe("given a null platform", () => {
    beforeEach(() => {
      render(<PlatformPill platform={null} />);
    });

    it("renders nothing", () => {
      expect(elements.queryContainer()).toBeNull();
    });
  });

  describe("given an empty string platform", () => {
    beforeEach(() => {
      render(<PlatformPill platform="" />);
    });

    it("renders nothing", () => {
      expect(elements.queryContainer()).toBeNull();
    });
  });
});
