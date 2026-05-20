/**
 * RED component test for SteamConnectCard (Slice 21 Phase B).
 *
 * Locked contracts:
 *   - Named export `SteamConnectCard` from `./steam-connect-card`.
 *   - Props: { steamId: string | null }.
 *   - Not-connected (steamId === null):
 *       - title "Connect Steam"
 *       - description copy
 *       - <a> link with accessible name "Connect Steam Account" pointing
 *         to Steam's OpenID login endpoint with return_to set to
 *         `${window.location.origin}/steam/callback`.
 *   - Connected (steamId is a string):
 *       - title "Steam connected"
 *       - shows the steam id text content
 *       - Alert hint with privacy-pending copy
 *       - "Disconnect" button → calls disconnectSteamFn({ data: {} }) and on
 *         success fires toast.success("Steam disconnected") + router.invalidate.
 *       - On rejection fires toast.error(err.message) and does NOT invalidate.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

// RED import — module does not exist until the GREEN step.
import { disconnectSteamFn } from "../../api/disconnect-steam";
// RED import — module does not exist until the GREEN step.
import { SteamConnectCard } from "./steam-connect-card";

// --- Server fn mock --------------------------------------------------------
vi.mock("../../api/disconnect-steam", () => ({
  disconnectSteamFn: vi.fn(),
}));

// --- Sonner mock -----------------------------------------------------------
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// --- Router mock -----------------------------------------------------------
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
  "&openid.return_to=http%3A%2F%2Flocalhost%2Fsteam%2Fcallback" +
  "&openid.realm=http%3A%2F%2Flocalhost" +
  "&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select" +
  "&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select";

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  queryConnectTitle: () => screen.queryByText("Connect Steam"),
  queryConnectedTitle: () => screen.queryByText("Steam connected"),
  queryConnectLink: () =>
    screen.queryByRole("link", { name: "Connect Steam Account" }),
  queryDisconnectButton: () =>
    screen.queryByRole("button", { name: "Disconnect" }),
  getDisconnectButton: () => screen.getByRole("button", { name: "Disconnect" }),
  querySteamIdText: (steamId: string) =>
    screen.queryByText(new RegExp(steamId)),
  queryPrivacyHint: () =>
    screen.queryByText(/check your Steam profile privacy settings/i),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  clickDisconnect: () => userEvent.click(elements.getDisconnectButton()),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SteamConnectCard", () => {
  beforeEach(() => {
    vi.mocked(disconnectSteamFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    invalidateMock.mockReset();
  });

  // ---- Not connected --------------------------------------------------------

  describe("given steamId is null (not connected)", () => {
    beforeEach(() => {
      render(<SteamConnectCard steamId={null} connectUrl={CONNECT_URL} />);
    });

    it("renders the 'Connect Steam' title", () => {
      expect(elements.queryConnectTitle()).not.toBeNull();
    });

    it("renders a 'Connect Steam Account' link pointing to the Steam OpenID endpoint", () => {
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

  // ---- Connected ------------------------------------------------------------

  describe("given steamId is set (connected)", () => {
    beforeEach(() => {
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
    });

    it("renders the 'Steam connected' title", () => {
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

    it("does not render the connect link in the connected state", () => {
      expect(elements.queryConnectLink()).toBeNull();
    });
  });

  // ---- Click Disconnect → server fn + toast + invalidate --------------------

  describe("given the user clicks Disconnect and the server fn resolves", () => {
    beforeEach(async () => {
      vi.mocked(disconnectSteamFn).mockResolvedValue(undefined as never);
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.clickDisconnect();
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

  // ---- Click Disconnect → server fn rejects ---------------------------------

  describe("given disconnectSteamFn rejects with an Error", () => {
    beforeEach(async () => {
      vi.mocked(disconnectSteamFn).mockRejectedValue(
        new Error("upstream-fail")
      );
      render(
        <SteamConnectCard steamId={STEAM_ID_64} connectUrl={CONNECT_URL} />
      );
      await actions.clickDisconnect();
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
});
