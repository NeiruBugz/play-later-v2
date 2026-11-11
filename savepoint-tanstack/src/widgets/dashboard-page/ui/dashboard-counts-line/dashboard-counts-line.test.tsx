import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { DashboardCountsLine } from "./dashboard-counts-line";

type Counts = { WANT: number; PLAYING: number; DONE: number };

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    search,
    ...rest
  }: {
    to?: string;
    children: ReactNode;
    search?: Record<string, string>;
  }) => {
    const query = search ? `?${new URLSearchParams(search).toString()}` : "";
    return (
      <a href={`${to}${query}`} {...rest}>
        {children}
      </a>
    );
  },
}));

const elements = {
  getLine: () => screen.getByTestId("dashboard-counts-line"),
  queryLine: () => screen.queryByTestId("dashboard-counts-line"),
  getStatusLink: (name: string) =>
    within(elements.getLine()).getByRole("link", { name }),
  queryStatusLink: (name: string) =>
    within(elements.getLine()).queryByRole("link", { name }),
};

function renderLine(counts: Counts) {
  render(<DashboardCountsLine counts={counts} />);
}

describe("DashboardCountsLine", () => {
  describe("given 28 games across all three statuses", () => {
    it("reads the total, then each status", () => {
      renderLine({ WANT: 18, PLAYING: 3, DONE: 7 });
      expect(elements.getLine()).toHaveTextContent(
        "28 games · 18 want · 3 playing · 7 done"
      );
    });

    it("links each status part to the Library filtered to it", () => {
      renderLine({ WANT: 18, PLAYING: 3, DONE: 7 });
      expect(elements.getStatusLink("18 want")).toHaveAttribute(
        "href",
        "/library?status=WANT"
      );
      expect(elements.getStatusLink("3 playing")).toHaveAttribute(
        "href",
        "/library?status=PLAYING"
      );
      expect(elements.getStatusLink("7 done")).toHaveAttribute(
        "href",
        "/library?status=DONE"
      );
    });
  });

  describe("given no Done games", () => {
    it("leaves the done part out", () => {
      renderLine({ WANT: 4, PLAYING: 1, DONE: 0 });
      expect(elements.getLine()).toHaveTextContent(
        "5 games · 4 want · 1 playing"
      );
      expect(elements.queryStatusLink("0 done")).toBeNull();
      expect(elements.getLine()).not.toHaveTextContent("done");
    });
  });

  describe("given exactly one game", () => {
    it("begins with 1 game", () => {
      renderLine({ WANT: 1, PLAYING: 0, DONE: 0 });
      expect(elements.getLine()).toHaveTextContent(/^1 game · 1 want$/);
    });
  });

  describe("given an empty library", () => {
    it("shows no line", () => {
      renderLine({ WANT: 0, PLAYING: 0, DONE: 0 });
      expect(elements.queryLine()).toBeNull();
    });
  });
});
