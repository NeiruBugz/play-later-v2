/**
 * Component test for SteamConnectCard.
 *
 * Locked contracts (aligned to canonical steam-connect-card after Slice 22):
 *   - Named export `SteamConnectCard` from `./steam-connect-card`.
 *   - Props: { steamId: string | null, connectUrl: string }.
 *   - Not-connected (steamId === null):
 *       - title "Connect Steam Account"
 *       - description copy
 *       - <a> link with accessible name "Sign in with Steam" pointing to
 *         Steam's OpenID login endpoint.
 *   - Connected (steamId is a string):
 *       - title "Steam Account Connected"
 *       - shows the steam id text content
 *       - Alert hint with privacy-pending copy
 *       - "Manage Imported Games" link to /steam/games
 *       - "Disconnect" opens a confirmation Dialog; confirming calls
 *         disconnectSteamFn({ data: {} }) and on success fires
 *         toast.success("Steam disconnected") + router.invalidate.
 *       - On rejection fires toast.error(err.message) and does NOT invalidate.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { disconnectSteamFn } from "../../api/disconnect-steam";
import { SteamConnectCard } from "./steam-connect-card";

vi.mock("../../api/disconnect-steam", () => ({
  disconnectSteamFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const invalidateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const STEAM_ID_64 = "76561198012345678";
const CONNECT_URL =
  "https://steamcommunity.com/openid/login" +
  "?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0" +
  "&openid.mode=checkid_setup" +
  "&openid.return_to=http%3A%2F%2Flocalhost%2Fsteam%2Fcallback";

const elements = {
  queryConnectTitle: () => screen.queryByText("Connect Steam Account"),
  queryConnectedTitle: () => screen.queryByText("Steam Account Connected"),
  queryConnectLink: () =>
    screen.queryByRole("link", { name: "Sign in with Steam" }),
  queryManageLink: () =>
    screen.queryByRole("link", { name: "Manage Imported Games" }),
  queryDisconnectButton: () =>
    screen.queryByRole("button", { name: "Disconnect" }),
  // The card-level "Disconnect" trigger (opens the dialog). When the dialog is
  // open both it and the confirm button share the name, so scope to the
  // first match in the card.
  getOpenDisconnectButton: () =>
    screen.getAllByRole("button", { name: "Disconnect" })[0]!,
  getDialog: () => screen.getByRole("dialog"),
  queryDialog: () => screen.queryByRole("dialog"),
  querySteamIdText: (steamId: string) =>
    screen.queryByText(steamId, { exact: false }),
  queryPrivacyHint: () =>
    screen.queryByText("check your Steam profile privacy settings", {
      exact: false,
    }),
};

const actions = {
  openDisconnectDialog: () =>
    userEvent.click(elements.getOpenDisconnectButton()),
  confirmDisconnect: async () => {
    await userEvent.click(elements.getOpenDisconnectButton());
    const dialog = elements.getDialog();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Disconnect" })
    );
  },
};

describe("SteamConnectCard", () => {
  beforeEach(() => {
    vi.mocked(disconnectSteamFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    invalidateMock.mockReset();
  });

  describe("given steamId is null (not connected)", () => {
    beforeEach(() => {
      render(<SteamConnectCard steamId={null} connectUrl={CONNECT_URL} />);
    });

    it("renders the 'Connect Steam Account' title", () => {
      expect(elements.queryConnectTitle()).not.toBeNull();
    });

    it("renders a 'Sign in with Steam' link pointing to the Steam OpenID endpoint", () => {
      const link = elements.queryConnectLink();
      expect(link).not.toBeNull();
      const href = link!.getAttribute("href") ?? "";
      expect(href.startsWith("https://steamcommunity.com/openid/login")).toBe(
        true
      );
      expect(href).toContain("openid.mode=checkid_setup");
      expect(href).toContain("steam%2Fcallback");
    });

    it("does not render the disconnect button", () => {
      expect(elements.queryDisconnectButton()).toBeNull();
    });
  });

  describe("given steamId is set (connected)", () => {
    beforeEach(() => {
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
    });

    it("renders the 'Steam Account Connected' title", () => {
      expect(elements.queryConnectedTitle()).not.toBeNull();
    });

    it("renders the Steam ID in the card", () => {
      expect(elements.querySteamIdText(STEAM_ID_64)).not.toBeNull();
    });

    it("renders the privacy-pending Alert hint", () => {
      expect(elements.queryPrivacyHint()).not.toBeNull();
    });

    it("renders the disconnect button", () => {
      expect(elements.queryDisconnectButton()).not.toBeNull();
    });

    it("renders the 'Manage Imported Games' link to /steam/games", () => {
      expect(elements.queryManageLink()).toHaveAttribute(
        "href",
        "/steam/games"
      );
    });

    it("does not render the connect link in the connected state", () => {
      expect(elements.queryConnectLink()).toBeNull();
    });
  });

  describe("given the user opens the disconnect dialog", () => {
    beforeEach(async () => {
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.openDisconnectDialog();
    });

    it("shows the confirmation dialog with preservation copy", () => {
      const dialog = elements.getDialog();
      expect(
        within(dialog).getByText("Disconnect Steam Account")
      ).toBeInTheDocument();
      expect(
        within(dialog).getByText(/imported games will be preserved/i)
      ).toBeInTheDocument();
    });

    it("does not call disconnectSteamFn until confirmed", () => {
      expect(vi.mocked(disconnectSteamFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the user confirms disconnect and the server fn resolves", () => {
    beforeEach(async () => {
      vi.mocked(disconnectSteamFn).mockResolvedValue(undefined as never);
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.confirmDisconnect();
    });

    it("calls disconnectSteamFn with the locked { data: {} } envelope", async () => {
      await waitFor(() => {
        expect(vi.mocked(disconnectSteamFn)).toHaveBeenCalledOnce();
      });
      expect(vi.mocked(disconnectSteamFn)).toHaveBeenCalledWith({ data: {} });
    });

    it("fires the success toast", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          "Steam disconnected"
        );
      });
    });

    it("invalidates the router so the loader re-runs", async () => {
      await waitFor(() => {
        expect(invalidateMock).toHaveBeenCalledOnce();
      });
    });
  });

  describe("given disconnectSteamFn rejects with an Error", () => {
    beforeEach(async () => {
      vi.mocked(disconnectSteamFn).mockRejectedValue(
        new Error("upstream-fail")
      );
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.confirmDisconnect();
    });

    it("fires toast.error with the err.message verbatim", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith("upstream-fail");
      });
    });

    it("does not fire toast.success on rejection", () => {
      expect(vi.mocked(toast.success)).not.toHaveBeenCalled();
    });

    it("does not invalidate the router on rejection", () => {
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });

  describe("given the user opens the disconnect dialog and clicks Cancel", () => {
    beforeEach(async () => {
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.openDisconnectDialog();
      const dialog = elements.getDialog();
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Cancel" })
      );
    });

    it("closes the confirmation dialog without calling disconnectSteamFn", () => {
      expect(elements.queryDialog()).toBeNull();
      expect(vi.mocked(disconnectSteamFn)).not.toHaveBeenCalled();
    });
  });
});
