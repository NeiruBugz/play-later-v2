import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { AlsoPlaying } from "./also-playing";

type Playing = DashboardPageData["playing"][number];

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children, ...rest }: { to?: string; children: ReactNode }) => {
    return (
      <a href={to} {...rest}>
        {children}
      </a>
    );
  },
}));
vi.mock("@/shared/lib/igdb-image", () => ({
  buildCoverImageUrl: () => "https://images.igdb.com/cover.jpg",
  buildCoverImageProps: () => ({
    src: "https://images.igdb.com/cover.jpg",
    srcSet: undefined,
  }),
}));

function playing(id: number, title: string): Playing {
  return {
    ...buildLibraryItemWithGame(
      { id, status: "PLAYING", platform: "PC" },
      { id: `game-${id}`, title, slug: title.toLowerCase() }
    ),
    lastSessionAt: null,
    becamePlayingAt: new Date(2026, 5, 1),
  };
}

const hades = playing(1, "Hades");
const celeste = playing(2, "Celeste");
const tunic = playing(3, "Tunic");

const elements = {
  queryRegion: () => screen.queryByRole("region", { name: "Also playing" }),
  getRegion: () => screen.getByRole("region", { name: "Also playing" }),
  getRowTitles: () =>
    within(elements.getRegion())
      .getAllByRole("listitem")
      .map((row) => within(row).getByRole("link").textContent),
  getLogButtons: () =>
    within(elements.getRegion()).getAllByRole("button", { name: "Log" }),
};

describe("AlsoPlaying", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  describe("given three Playing games", () => {
    beforeEach(() => {
      render(<AlsoPlaying playing={[hades, celeste, tunic]} />);
    });

    it("lists every Playing game except the first, in question order", () => {
      expect(elements.getRowTitles()).toEqual(["Celeste", "Tunic"]);
    });

    it("never lists the game the question asks about", () => {
      expect(screen.queryByText("Hades")).toBeNull();
    });

    describe("when the user taps Log on the second row", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getLogButtons()[1]);
      });

      it("opens the Log sheet for that game", () => {
        const { search } = navigateMock.mock.calls[0][0];
        expect(search({})).toEqual({ action: "log-session", game: "tunic" });
      });
    });
  });

  describe("given three Playing games after the data reorders them", () => {
    it("follows the new order and drops the new first game", () => {
      const { rerender } = render(
        <AlsoPlaying playing={[hades, celeste, tunic]} />
      );
      rerender(<AlsoPlaying playing={[tunic, hades, celeste]} />);
      expect(elements.getRowTitles()).toEqual(["Hades", "Celeste"]);
    });
  });

  describe("given one Playing game", () => {
    it("shows no Also playing section", () => {
      render(<AlsoPlaying playing={[hades]} />);
      expect(elements.queryRegion()).toBeNull();
    });
  });

  describe("given no Playing games", () => {
    it("shows no Also playing section", () => {
      render(<AlsoPlaying playing={[]} />);
      expect(elements.queryRegion()).toBeNull();
    });
  });
});
