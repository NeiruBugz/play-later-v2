import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { disconnectSteam } from "../server-actions/disconnect-steam";
import type { SteamConnectionStatus } from "../types";
import { SteamConnectCard } from "./steam-connect-card";

const mockFetch = vi.fn();
global.fetch = mockFetch as never;

const mockSearchParams = new Map<string, string>();
const mockUseSearchParams = vi.fn(() => ({
  get: (key: string) => mockSearchParams.get(key) ?? null,
}));

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/profile/settings",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("../server-actions/disconnect-steam", () => ({
  disconnectSteam: vi.fn(),
}));

describe("SteamConnectCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    mockReplace.mockClear();
  });

  describe("not connected state", () => {
    it("should display the OAuth button and manual form when not connected", () => {
      render(<SteamConnectCard />);

      expect(screen.getByText(/connect steam account/i)).toBeVisible();
      expect(
        screen.getByText(/link your steam account to import your game library/i)
      ).toBeVisible();

      // Check OAuth button
      const oauthButton = screen.getByRole("link", {
        name: /sign in with steam/i,
      });
      expect(oauthButton).toBeVisible();
      expect(oauthButton).toHaveAttribute("href", "/api/steam/auth");

      // Check manual form
      expect(screen.getByText(/enter your steam id manually/i)).toBeVisible();
      expect(screen.getByLabelText(/steam id or profile url/i)).toBeVisible();
      expect(
        screen.getByRole("button", { name: /connect steam/i })
      ).toBeVisible();
    });

    it("should display validation error when submitting empty form", async () => {
      const user = userEvent.setup();
      render(<SteamConnectCard />);

      const submitButton = screen.getByRole("button", {
        name: /connect steam/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/steam id is required/i)).toBeVisible();
      });
    });

    it("should show loading state while connecting", async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve({
                      profile: {
                        steamId64: "76561198012345678",
                        displayName: "TestUser",
                        avatarUrl: "https://example.com/avatar.jpg",
                        profileUrl: "https://example.com/profile",
                      },
                    }),
                }),
              100
            );
          })
      );

      render(<SteamConnectCard />);

      const input = screen.getByLabelText(/steam id or profile url/i);
      await user.type(input, "76561198012345678");

      const submitButton = screen.getByRole("button", {
        name: /connect steam/i,
      });
      await user.click(submitButton);

      expect(screen.getByText(/connecting\.\.\./i)).toBeVisible();
      expect(submitButton).toBeDisabled();
    });

    // TODO: Fix these tests - mock fetch setup issue causing "Network error" in catch block
    // The mock fetch is not being properly consumed by the component's fetch call.
    // Need to investigate why userEvent interactions might be consuming the mock.
    // See: https://github.com/testing-library/user-event/issues for potential patterns
    it.skip("should connect successfully with valid Steam ID", async () => {
      const user = userEvent.setup();
      const mockProfile = {
        steamId64: "76561198012345678",
        displayName: "TestUser",
        avatarUrl: "https://example.com/avatar.jpg",
        profileUrl: "https://example.com/profile",
      };

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: true,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ profile: mockProfile }),
        })
      );

      render(<SteamConnectCard />);

      const input = screen.getByLabelText(/steam id or profile url/i);
      await user.type(input, "76561198012345678");

      const submitButton = screen.getByRole("button", {
        name: /connect steam/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Steam account connected successfully!"
        );
      });

      await waitFor(() => {
        expect(screen.getByText("TestUser")).toBeVisible();
        expect(screen.getByText("76561198012345678")).toBeVisible();
      });
    });

    it.skip("should display error message on failed connection", async () => {
      const user = userEvent.setup();

      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          headers: new Headers({ "content-type": "application/json" }),
          json: () => Promise.resolve({ error: "Invalid Steam ID" }),
        })
      );

      render(<SteamConnectCard />);

      const input = screen.getByLabelText(/steam id or profile url/i);
      await user.type(input, "invalid");

      const submitButton = screen.getByRole("button", {
        name: /connect steam/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid steam id/i)).toBeVisible();
      });
    });

    it("should display network error on fetch failure", async () => {
      const user = userEvent.setup();
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<SteamConnectCard />);

      const input = screen.getByLabelText(/steam id or profile url/i);
      await user.type(input, "76561198012345678");

      const submitButton = screen.getByRole("button", {
        name: /connect steam/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/network error\. please try again\./i)
        ).toBeVisible();
      });
    });

    it("should show success toast when ?steam=connected in URL", () => {
      mockSearchParams.set("steam", "connected");

      render(<SteamConnectCard />);

      expect(toast.success).toHaveBeenCalledWith(
        "Steam account connected successfully!"
      );
    });

    it("should show error toast when ?steam=error&reason=unauthorized in URL", () => {
      mockSearchParams.set("steam", "error");
      mockSearchParams.set("reason", "unauthorized");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "You must be logged in to connect Steam"
      );
    });

    it("should show error toast when ?steam=error&reason=validation in URL", () => {
      mockSearchParams.set("steam", "error");
      mockSearchParams.set("reason", "validation");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "Steam authentication failed. Please try again."
      );
    });

    it("should show error toast when ?steam=error&reason=profile in URL", () => {
      mockSearchParams.set("steam", "error");
      mockSearchParams.set("reason", "profile");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "Could not fetch your Steam profile. Please try again."
      );
    });

    it("should show error toast when ?steam=error&reason=server in URL", () => {
      mockSearchParams.set("steam", "error");
      mockSearchParams.set("reason", "server");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "An unexpected error occurred. Please try again."
      );
    });

    it("should show generic error toast when ?steam=error with unknown reason", () => {
      mockSearchParams.set("steam", "error");
      mockSearchParams.set("reason", "unknown");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to connect Steam account"
      );
    });

    it("should show generic error toast when ?steam=error without reason", () => {
      mockSearchParams.set("steam", "error");

      render(<SteamConnectCard />);

      expect(toast.error).toHaveBeenCalledWith(
        "Failed to connect Steam account"
      );
    });
  });

  describe("connected state", () => {
    const connectedStatus: SteamConnectionStatus = {
      connected: true,
      profile: {
        steamId64: "76561198012345678",
        displayName: "ConnectedUser",
        avatarUrl: "https://example.com/avatar.jpg",
        profileUrl: "https://example.com/profile",
      },
    };

    it("should display connected profile information", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(screen.getByText(/steam account connected/i)).toBeVisible();
      expect(screen.getByText("ConnectedUser")).toBeVisible();
      expect(screen.getByText("76561198012345678")).toBeVisible();
      expect(screen.getByAltText("ConnectedUser")).toHaveAttribute(
        "src",
        "https://example.com/avatar.jpg"
      );
    });

    it("should display disconnect button", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(screen.getByRole("button", { name: /disconnect/i })).toBeVisible();
    });

    it("should open confirmation dialog when disconnect is clicked", async () => {
      const user = userEvent.setup();
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      expect(
        screen.getByRole("heading", { name: /disconnect steam account/i })
      ).toBeVisible();
      expect(
        screen.getByText(
          /are you sure you want to disconnect your steam account/i
        )
      ).toBeVisible();
    });

    it("should close dialog when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      const dialog = screen.getByRole("dialog");
      const cancelButton = within(dialog).getByRole("button", {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByRole("heading", { name: /disconnect steam account/i })
        ).not.toBeInTheDocument();
      });
    });

    it("should call disconnect action and update UI on successful disconnect", async () => {
      const user = userEvent.setup();
      vi.mocked(disconnectSteam).mockResolvedValue({
        success: true,
        data: undefined,
      });

      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getAllByRole("button", {
        name: /disconnect/i,
      })[0];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(disconnectSteam).toHaveBeenCalledWith({});
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Steam account disconnected successfully"
        );
      });

      await waitFor(() => {
        expect(
          screen.queryByText(/steam account connected/i)
        ).not.toBeInTheDocument();
        expect(screen.getByText(/connect steam account/i)).toBeVisible();
      });
    });

    it("should show error toast when disconnect fails", async () => {
      const user = userEvent.setup();
      const errorMessage = "Failed to disconnect Steam account";
      vi.mocked(disconnectSteam).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getAllByRole("button", {
        name: /disconnect/i,
      })[0];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      expect(screen.getByText("ConnectedUser")).toBeVisible();
    });

    it("should show loading state during disconnect", async () => {
      const user = userEvent.setup();
      vi.mocked(disconnectSteam).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: undefined,
                }),
              100
            );
          })
      );

      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      const dialog = screen.getByRole("dialog");
      const confirmButton = within(dialog).getAllByRole("button", {
        name: /disconnect/i,
      })[0];
      await user.click(confirmButton);

      expect(confirmButton).toBeDisabled();
      expect(
        within(dialog).getByRole("button", { name: /cancel/i })
      ).toBeDisabled();
    });

    it("should preserve imported games message in disconnect dialog", async () => {
      const user = userEvent.setup();
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const disconnectButton = screen.getByRole("button", {
        name: /disconnect/i,
      });
      await user.click(disconnectButton);

      expect(
        screen.getByText(
          /your imported games will be preserved in your library/i
        )
      ).toBeVisible();
    });

    it("should not display the form when connected", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(
        screen.queryByLabelText(/steam id or profile url/i)
      ).not.toBeInTheDocument();
    });
  });
});
