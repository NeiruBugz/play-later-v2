import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Command, CommandList } from "@/shared/ui/command";

import { PaletteNavigationGroup } from "./palette-navigation-group";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    onClick,
    ...rest
  }: {
    to?: string;
    children: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => (
    <a href={to ?? ""} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  queryItem: (name: string) => screen.queryByText(name),
  getItem: (name: string) => screen.getByText(name),
  queryHeading: () => screen.queryByText("Navigation"),
};

function renderGroup(query = "") {
  render(
    <Command>
      <CommandList>
        <PaletteNavigationGroup query={query} onAfterSelect={vi.fn()} />
      </CommandList>
    </Command>
  );
}

describe("PaletteNavigationGroup", () => {
  describe("given an empty query", () => {
    beforeEach(() => {
      renderGroup("");
    });

    it("renders all five jump targets", () => {
      expect(elements.queryItem("Library")).not.toBeNull();
      expect(elements.queryItem("Journal")).not.toBeNull();
      expect(elements.queryItem("Profile")).not.toBeNull();
      expect(elements.queryItem("Settings")).not.toBeNull();
      expect(elements.queryItem("Dashboard")).not.toBeNull();
    });

    it("anchors each item at its registered route", () => {
      expect(elements.getItem("Library").closest("a")?.getAttribute("href")).toBe(
        "/library"
      );
      expect(elements.getItem("Settings").closest("a")?.getAttribute("href")).toBe(
        "/settings/profile"
      );
    });
  });

  describe("given a query that matches a single label", () => {
    beforeEach(() => {
      renderGroup("lib");
    });

    it("filters out non-matching items", () => {
      expect(elements.queryItem("Library")).not.toBeNull();
      expect(elements.queryItem("Journal")).toBeNull();
      expect(elements.queryItem("Settings")).toBeNull();
    });
  });

  describe("given a query that matches nothing", () => {
    beforeEach(() => {
      renderGroup("zzzzz");
    });

    it("renders nothing — not even the heading", () => {
      expect(elements.queryHeading()).toBeNull();
    });
  });
});
