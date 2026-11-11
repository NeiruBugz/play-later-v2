import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { ContinuePanel } from "./continue-panel";

const { setStatusFnMock } = vi.hoisted(() => ({ setStatusFnMock: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }: { to?: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: setStatusFnMock,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));
vi.mock("@/entities/session/model", () => ({ useEveningMinutes: () => 105 }));

type Playing = DashboardPageData["playing"][number];

const playing = (id: number, title: string, daysAgo: number): Playing => ({
  ...buildLibraryItemWithGame(
    { id, status: "PLAYING" },
    { id: `game-${id}`, title, slug: title.toLowerCase() }
  ),
  lastSessionAt: new Date(Date.now() - daysAgo * 86_400_000),
  becamePlayingAt: new Date(Date.now() - 100 * 86_400_000),
});

const lists = {
  playing: [playing(1, "Hades", 3), playing(2, "Celeste", 14)],
  upNextQueue: [],
};

describe("@spec: 028-continue-identity-stand-out @regression leaving Home forgets Not tonight", () => {
  beforeEach(() => {
    setStatusFnMock.mockReset();
  });

  describe("given the user tapped Not tonight on a game", () => {
    describe("when they go to the Library and come back to Home", () => {
      it("asks about the most recently played Playing game again and changes nothing", async () => {
        const firstVisit = render(<ContinuePanel {...lists} />);
        await userEvent.click(
          screen.getByRole("button", { name: "Not tonight" })
        );
        expect(
          screen.getByRole("heading", { name: "Continue Celeste?" })
        ).toBeVisible();

        firstVisit.unmount();
        render(<ContinuePanel {...lists} />);

        expect(
          screen.getByRole("heading", { name: "Continue Hades?" })
        ).toBeVisible();
        expect(setStatusFnMock).not.toHaveBeenCalled();
      });
    });
  });
});
