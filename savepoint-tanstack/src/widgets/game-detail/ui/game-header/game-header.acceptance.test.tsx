import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailData } from "../game-detail/game-detail.type";
import { GameHeader } from "./game-header";

const { historyBackMock, canGoBackRef } = vi.hoisted(() => ({
  historyBackMock: vi.fn(),
  canGoBackRef: { current: true },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ history: { back: historyBackMock } }),
  useCanGoBack: () => canGoBackRef.current,
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const buildData = (coverTint: GameDetailData["coverTint"]): GameDetailData =>
  ({
    game: {
      id: "game-1",
      title: "Skyline Run",
      slug: "skyline-run",
      coverImage: null,
    },
    igdbDetails: { id: 1, name: "Skyline Run", slug: "skyline-run" },
    libraryEntry: null,
    notes: [],
    playtimeTotalMinutes: 0,
    playtimeSessionCount: 0,
    timeToCreditsSeconds: null,
    timeToCompleteSeconds: null,
    coverTint,
  }) as unknown as GameDetailData;

const elements = {
  getBack: () => screen.getByRole("button", { name: "Back" }),
  // eslint-disable-next-line testing-library/no-node-access -- CoverTint exposes only data-tint
  getTint: () => document.querySelector("[data-tint]"),
};

describe("@spec: 028-continue-identity-stand-out @regression game page header", () => {
  beforeEach(() => {
    historyBackMock.mockReset();
    canGoBackRef.current = true;
  });

  describe("given a game with a mostly green cover", () => {
    it("tints the header", () => {
      render(
        <GameHeader
          data={buildData({ hue: 140, chroma: 0.08 })}
          eveningMinutes={105}
        />
      );

      expect(elements.getTint()).toHaveAttribute("data-tint", "on");
      expect(elements.getTint()).toHaveAttribute("data-variant", "header");
    });
  });

  describe("given a game whose cover is black and white", () => {
    it("keeps the plain neutral card colour", () => {
      render(<GameHeader data={buildData(null)} eveningMinutes={105} />);

      expect(elements.getTint()).toHaveAttribute("data-tint", "off");
    });
  });

  describe("given the user opened the game page from Home", () => {
    describe("when they tap Back", () => {
      it("goes back in history, to Home", async () => {
        render(<GameHeader data={buildData(null)} eveningMinutes={105} />);

        await userEvent.click(elements.getBack());

        expect(historyBackMock).toHaveBeenCalledTimes(1);
      });
    });
  });
});
