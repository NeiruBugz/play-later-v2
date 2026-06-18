import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { PageHeader } from "./page-header";

const elements = {
  getTitle: (name: string) => screen.getByRole("heading", { name, level: 1 }),
  getEyebrow: (text: string) => screen.getByText(text),
  getSub: (text: string) => screen.getByText(text),
  getAction: (name: string) => screen.getByRole("button", { name }),
  queryEyebrow: (text: string) => screen.queryByText(text),
};

describe("PageHeader", () => {
  describe("given a title only", () => {
    beforeEach(() => {
      render(<PageHeader title="Library" />);
    });

    it("renders the title as a level-1 heading", () => {
      expect(elements.getTitle("Library")).toBeInTheDocument();
    });

    it("does not render an eyebrow when none is provided", () => {
      expect(elements.queryEyebrow("// LIBRARY")).toBeNull();
    });
  });

  describe("given eyebrow, sub, and actions", () => {
    beforeEach(() => {
      render(
        <PageHeader
          eyebrow="// LIBRARY"
          title="Your library"
          sub="42 games tracked"
          actions={<button type="button">Add a game</button>}
        />
      );
    });

    it("renders the eyebrow", () => {
      expect(elements.getEyebrow("// LIBRARY")).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      expect(elements.getSub("42 games tracked")).toBeInTheDocument();
    });

    it("renders the action slot", () => {
      expect(elements.getAction("Add a game")).toBeInTheDocument();
    });
  });
});
