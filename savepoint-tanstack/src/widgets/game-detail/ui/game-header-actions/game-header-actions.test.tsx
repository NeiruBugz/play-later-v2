import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { GameHeaderActions } from "./game-header-actions";

const { navigateMock, setStatusMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  setStatusMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: () => navigateMock,
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => true,
}));
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));
vi.mock("@/features/add-game/api/add-game-fn", () => ({ addGameFn: vi.fn() }));
vi.mock("@/features/add-game/api/undo-add-game-fn", () => ({
  undoAddGameFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/set-done-outcome-fn", () => ({
  setDoneOutcomeFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));

type RenderOptions = {
  status?: "WANT" | "PLAYING" | "DONE";
  doneOutcome?: "FINISHED" | "LET_GO" | null;
  inLibrary?: boolean;
  signedIn?: boolean;
};

function renderActions({
  status = "PLAYING",
  doneOutcome = null,
  inLibrary = true,
  signedIn = true,
}: RenderOptions = {}) {
  render(
    <GameHeaderActions
      igdbId={1234}
      gameTitle="Hollow Knight"
      gameSlug="hollow-knight"
      entry={inLibrary ? buildLibraryItem({ id: 7, status }) : null}
      libraryStatus={
        inLibrary
          ? { status, setStatus: setStatusMock, isPending: false }
          : null
      }
      doneOutcome={doneOutcome}
      viewerUserId={signedIn ? "user-1" : null}
    />
  );
}

const elements = {
  queryStatusControl: () =>
    screen.queryByRole("button", { name: /^Status: .*\. Change$/ }),
  queryButton: (name: string) => screen.queryByRole("button", { name }),
  getButton: (name: string) => screen.getByRole("button", { name }),
  queryAddButtons: () =>
    screen.queryAllByRole("button", { name: "Add to library" }),
  querySignInLink: () =>
    screen.queryByRole("link", { name: "Sign in to add this game" }),
  queryOutcomeDropdown: (label: string) =>
    screen.queryByRole("button", { name: `${label}, change how it ended` }),
};

describe("GameHeaderActions", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    setStatusMock.mockReset();
  });

  describe("given a Playing game in the library", () => {
    beforeEach(() => {
      renderActions({ status: "PLAYING" });
    });

    it("shows the status control, Log time and Done with it?", () => {
      expect(elements.queryStatusControl()).toHaveAccessibleName(
        "Status: Playing. Change"
      );
      expect(elements.queryButton("Log time")).toBeInTheDocument();
      expect(elements.queryButton("Done with it?")).toBeInTheDocument();
    });

    it("opens the Log sheet for this game from Log time", async () => {
      await userEvent.click(elements.getButton("Log time"));

      const { search } = navigateMock.mock.calls[0][0];
      expect(search({})).toMatchObject({
        action: "log-session",
        game: "hollow-knight",
      });
    });

    it("offers no add action", () => {
      expect(elements.queryAddButtons()).toHaveLength(0);
    });
  });

  describe("given a Want game in the library", () => {
    beforeEach(() => {
      renderActions({ status: "WANT" });
    });

    it("shows Start playing as the primary button and no Done with it?", () => {
      expect(elements.queryButton("Start playing")).toBeInTheDocument();
      expect(elements.queryButton("Done with it?")).toBeNull();
      expect(elements.queryButton("Log time")).toBeNull();
    });

    it("moves the game to Playing when Start playing is tapped", async () => {
      await userEvent.click(elements.getButton("Start playing"));

      expect(setStatusMock).toHaveBeenCalledExactlyOnceWith("PLAYING");
    });
  });

  describe("given a Done game that was let go", () => {
    beforeEach(() => {
      renderActions({ status: "DONE", doneOutcome: "LET_GO" });
    });

    it("reads Done · Let go on the status control", () => {
      expect(elements.queryStatusControl()).toHaveTextContent("Done · Let go");
    });

    it("shows Play again and no Done with it?", () => {
      expect(elements.queryButton("Play again")).toBeInTheDocument();
      expect(elements.queryButton("Done with it?")).toBeNull();
    });

    it("keeps the dropdown that changes how it ended", () => {
      expect(
        elements.queryOutcomeDropdown("Done · Let go")
      ).toBeInTheDocument();
    });

    it("moves the game back to Playing when Play again is tapped", async () => {
      await userEvent.click(elements.getButton("Play again"));

      expect(setStatusMock).toHaveBeenCalledExactlyOnceWith("PLAYING");
    });
  });

  describe("given a signed-in user whose library does not have the game", () => {
    beforeEach(() => {
      renderActions({ inLibrary: false });
    });

    it("shows exactly one Add to library and nothing else", () => {
      expect(elements.queryAddButtons()).toHaveLength(1);
      expect(elements.queryStatusControl()).toBeNull();
      expect(elements.queryButton("Log time")).toBeNull();
      expect(elements.querySignInLink()).toBeNull();
    });
  });

  describe("given a signed-out visitor", () => {
    beforeEach(() => {
      renderActions({ inLibrary: false, signedIn: false });
    });

    it("shows only the sign-in link", () => {
      expect(elements.querySignInLink()).toHaveAttribute("href", "/login");
      expect(screen.queryAllByRole("button")).toHaveLength(0);
    });
  });
});
