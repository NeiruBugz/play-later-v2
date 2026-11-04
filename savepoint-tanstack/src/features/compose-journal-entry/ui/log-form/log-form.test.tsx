import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogFollowUpsProvider } from "../../model";
import { LogForm } from "./log-form";

const mocks = vi.hoisted(() => ({
  getLoggableGamesFn: vi.fn(),
  logTimeFn: vi.fn(),
  invalidate: vi.fn(),
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/features/compose-journal-entry/api/get-loggable-games", () => ({
  getLoggableGamesFn: mocks.getLoggableGamesFn,
}));
vi.mock("@/features/compose-journal-entry/api/log-time-fn", () => ({
  logTimeFn: mocks.logTimeFn,
}));

const HOLLOW_KNIGHT = {
  libraryItemId: 1,
  upNextPosition: null,
  gameId: "game-1",
  slug: "hollow-knight",
  title: "Hollow Knight",
  coverImage: "co1abc",
  status: "PLAYING" as const,
};
const CELESTE = {
  libraryItemId: 2,
  upNextPosition: null,
  gameId: "game-2",
  slug: "celeste",
  title: "Celeste",
  coverImage: null,
  status: "WANT" as const,
};

const elements = {
  save: () => screen.getByRole("button", { name: "Save" }),
  search: () => screen.getByRole("searchbox", { name: "Search your library" }),
  note: () => screen.getByRole("textbox", { name: "Note" }),
  increase: () =>
    screen.getByRole("button", { name: "Increase time played by 0.5 hours" }),
  header: () => screen.getByTestId("selected-game-header"),
  gameButton: (title: string) =>
    screen.findByRole("button", { name: new RegExp(title) }),
};

async function renderForm(props: { gameSlug?: string } = {}) {
  const onClose = vi.fn();
  const markPlaying = vi.fn().mockResolvedValue(true);
  render(
    <LogFollowUpsProvider value={{ markPlaying }}>
      <LogForm {...props} onClose={onClose} />
    </LogFollowUpsProvider>
  );
  await waitFor(() => expect(mocks.getLoggableGamesFn).toHaveBeenCalled());
  return { onClose, markPlaying };
}

describe("LogForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLoggableGamesFn.mockResolvedValue([HOLLOW_KNIGHT, CELESTE]);
    mocks.logTimeFn.mockResolvedValue({
      noteId: "note-1",
      offerMarkPlaying: false,
    });
  });

  describe("when opened without a game", () => {
    it("lists library games with a search field that filters them", async () => {
      const user = userEvent.setup();
      await renderForm();
      await elements.gameButton("Hollow Knight");
      expect(await elements.gameButton("Celeste")).toBeDefined();

      await user.type(elements.search(), "cel");

      expect(
        screen.queryByRole("button", { name: /Hollow Knight/ })
      ).toBeNull();
      expect(screen.getByRole("button", { name: /Celeste/ })).toBeDefined();
    });

    it("keeps the game list in a height-capped scroll container", async () => {
      await renderForm();
      await elements.gameButton("Celeste");
      expect(screen.getByTestId("log-game-list").className).toMatch(
        /max-h-\[min\(40dvh/
      );
      expect(screen.getByTestId("log-game-list").className).toMatch(
        /overflow-y-auto/
      );
    });

    it("shows the picked game's title and cover at the top", async () => {
      const user = userEvent.setup();
      await renderForm();
      await user.click(await elements.gameButton("Hollow Knight"));

      expect(
        within(elements.header()).getByText("Hollow Knight")
      ).toBeDefined();
      expect(
        within(elements.header()).getByRole("img", {
          name: "Cover for Hollow Knight",
        })
      ).toBeDefined();
      expect(screen.queryByRole("searchbox")).toBeNull();
    });

    it("disables Save with neither text nor time", async () => {
      await renderForm();
      await elements.gameButton("Celeste");
      expect(elements.save()).toHaveProperty("disabled", true);
    });

    it("enables Save with text only and saves a note without a game", async () => {
      const user = userEvent.setup();
      await renderForm();
      await elements.gameButton("Celeste");
      await user.type(elements.note(), "Great boss");
      expect(elements.save()).toHaveProperty("disabled", false);

      await user.click(elements.save());

      await waitFor(() =>
        expect(mocks.logTimeFn).toHaveBeenCalledWith({
          data: { gameId: null, content: "Great boss", playedMinutes: null },
        })
      );
      expect(mocks.toast).toHaveBeenCalledWith("Note saved");
    });

    it("disables Save and asks to choose a game when time is set without one", async () => {
      const user = userEvent.setup();
      await renderForm();
      await elements.gameButton("Celeste");

      await user.click(elements.increase());

      expect(screen.getByText("Choose a game to log time.")).toBeDefined();
      expect(elements.save()).toHaveProperty("disabled", true);
    });
  });

  describe("when opened with a game", () => {
    it("shows the game header and no picker", async () => {
      await renderForm({ gameSlug: "celeste" });
      expect(await screen.findByTestId("selected-game-header")).toBeDefined();
      expect(screen.queryByRole("searchbox")).toBeNull();
    });

    it("enables Save with time only and logs the minutes with the confirmation", async () => {
      const user = userEvent.setup();
      const { onClose } = await renderForm({ gameSlug: "celeste" });
      await screen.findByTestId("selected-game-header");
      for (let i = 0; i < 3; i += 1) await user.click(elements.increase());
      expect(elements.save()).toHaveProperty("disabled", false);

      await user.click(elements.save());

      await waitFor(() =>
        expect(mocks.logTimeFn).toHaveBeenCalledWith({
          data: { gameId: "game-2", content: undefined, playedMinutes: 90 },
        })
      );
      expect(mocks.toast).toHaveBeenCalledWith("Logged 1.5 h for Celeste");
      expect(onClose).toHaveBeenCalled();
    });

    it("offers Mark as Playing only when the server asks for it", async () => {
      mocks.logTimeFn.mockResolvedValue({
        noteId: "note-1",
        offerMarkPlaying: true,
      });
      const user = userEvent.setup();
      const { markPlaying } = await renderForm({ gameSlug: "celeste" });
      await screen.findByTestId("selected-game-header");
      await user.click(elements.increase());
      await user.click(elements.save());

      await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
      const [message, options] = mocks.toast.mock.calls[0];
      expect(message).toBe("Logged 0.5 h for Celeste");
      expect(options.action.label).toBe("Mark as Playing");

      options.action.onClick();
      expect(markPlaying).toHaveBeenCalledWith(CELESTE);
    });

    it("does not offer Mark as Playing when the server does not", async () => {
      const user = userEvent.setup();
      await renderForm({ gameSlug: "hollow-knight" });
      await screen.findByTestId("selected-game-header");
      await user.click(elements.increase());
      await user.click(elements.save());

      await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
      expect(mocks.toast).toHaveBeenCalledWith(
        "Logged 0.5 h for Hollow Knight"
      );
    });

    it("shows plain-language copy when saving fails and stays open", async () => {
      mocks.logTimeFn.mockRejectedValue(
        Object.assign(new Error("boom"), { code: "UPSTREAM" })
      );
      const user = userEvent.setup();
      const { onClose } = await renderForm({ gameSlug: "celeste" });
      await screen.findByTestId("selected-game-header");
      await user.click(elements.increase());
      await user.click(elements.save());

      await waitFor(() =>
        expect(mocks.toast.error).toHaveBeenCalledWith(
          "Couldn't save. Try again."
        )
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("fields", () => {
    it("has no playthrough, type, mood or title controls", async () => {
      await renderForm({ gameSlug: "celeste" });
      await screen.findByTestId("selected-game-header");
      expect(screen.queryByText(/playthrough/i)).toBeNull();
      expect(screen.queryByText(/mood/i)).toBeNull();
      expect(screen.queryByLabelText(/title/i)).toBeNull();
      expect(screen.queryByLabelText(/type|kind/i)).toBeNull();
    });
  });
});
