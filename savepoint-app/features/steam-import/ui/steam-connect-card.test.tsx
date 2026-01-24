import { defaultSteamProfile } from "@/test/mocks/handlers";
import { server } from "@/test/setup/client-setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";

import { disconnectSteam } from "../server-actions/disconnect-steam";
import type { SteamConnectionStatus } from "../types";
import { SteamConnectCard } from "./steam-connect-card";

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

const elements = {
  getCardTitle: () => screen.getByText(/connect steam account/i),
  getCardDescription: () =>
    screen.getByText(/link your steam account to import your game library/i),
  getOAuthButton: () =>
    screen.getByRole("link", { name: /sign in with steam/i }),
  getManualFormLabel: () => screen.getByText(/enter your steam id manually/i),
  getSteamIdInput: () => screen.getByLabelText(/steam id or profile url/i),
  querySteamIdInput: () => screen.queryByLabelText(/steam id or profile url/i),
  getSubmitButton: () => screen.getByRole("button", { name: /connect steam/i }),
  getConnectingButton: () =>
    screen.getByRole("button", { name: /connecting/i }),
  getValidationError: () => screen.getByText(/steam id is required/i),
  getDisconnectButton: () =>
    screen.getByRole("button", { name: /disconnect/i }),
  getDialog: () => screen.getByRole("dialog"),
  queryDialog: () => screen.queryByRole("dialog"),
  getDialogTitle: () =>
    screen.getByRole("heading", { name: /disconnect steam account/i }),
  queryDialogTitle: () =>
    screen.queryByRole("heading", { name: /disconnect steam account/i }),
  getDialogDescription: () =>
    screen.getByText(/are you sure you want to disconnect your steam account/i),
  getImportedGamesMessage: () =>
    screen.getByText(/your imported games will be preserved in your library/i),
  getConnectedTitle: () => screen.getByText(/steam account connected/i),
  queryConnectedTitle: () => screen.queryByText(/steam account connected/i),
  getProfileDisplayName: (name: string) => screen.getByText(name),
  getProfileSteamId: (steamId: string) => screen.getByText(steamId),
  getProfileAvatar: (altText: string) => screen.getByAltText(altText),
  getErrorMessage: (message: RegExp | string) => screen.getByText(message),
  getManageImportedGamesLink: () =>
    screen.getByRole("link", { name: /manage imported games/i }),
};

const actions = {
  typeSteamId: async (steamId: string) => {
    await userEvent.type(elements.getSteamIdInput(), steamId);
  },
  submitForm: async () => {
    await userEvent.click(elements.getSubmitButton());
  },
  typeAndSubmit: async (steamId: string) => {
    await actions.typeSteamId(steamId);
    await actions.submitForm();
  },
  clickDisconnect: async () => {
    await userEvent.click(elements.getDisconnectButton());
  },
  clickDialogCancel: async () => {
    const dialog = elements.getDialog();
    const cancelButton = within(dialog).getByRole("button", {
      name: /cancel/i,
    });
    await userEvent.click(cancelButton);
  },
  clickDialogConfirmDisconnect: async () => {
    const dialog = elements.getDialog();
    const confirmButton = within(dialog).getAllByRole("button", {
      name: /disconnect/i,
    })[0];
    await userEvent.click(confirmButton);
  },
};

const connectedStatus: SteamConnectionStatus = {
  connected: true,
  profile: {
    steamId64: "76561198012345678",
    displayName: "ConnectedUser",
    avatarUrl: "https://example.com/avatar.jpg",
    profileUrl: "https://example.com/profile",
  },
};

describe("SteamConnectCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.clear();
    mockReplace.mockClear();
  });

  describe("given not connected state", () => {
    it("should display the OAuth button and manual form when not connected", () => {
      render(<SteamConnectCard />);

      expect(elements.getCardTitle()).toBeVisible();
      expect(elements.getCardDescription()).toBeVisible();

      const oauthButton = elements.getOAuthButton();
      expect(oauthButton).toBeVisible();
      expect(oauthButton).toHaveAttribute("href", "/api/steam/auth");

      expect(elements.getManualFormLabel()).toBeVisible();
      expect(elements.getSteamIdInput()).toBeVisible();
      expect(elements.getSubmitButton()).toBeVisible();
    });

    it("should display validation error when submitting empty form", async () => {
      render(<SteamConnectCard />);

      await actions.submitForm();

      await waitFor(() => {
        expect(elements.getValidationError()).toBeVisible();
      });
    });

    it("should show loading state while connecting", async () => {
      server.use(
        http.post("/api/steam/connect", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ profile: defaultSteamProfile });
        })
      );

      render(<SteamConnectCard />);

      await actions.typeAndSubmit("76561198012345678");

      expect(elements.getConnectingButton()).toBeVisible();
      expect(elements.getConnectingButton()).toBeDisabled();
    });

    it("should connect successfully with valid Steam ID", async () => {
      render(<SteamConnectCard />);

      await actions.typeAndSubmit("76561198012345678");

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Steam account connected successfully!"
        );
      });

      await waitFor(() => {
        expect(elements.getProfileDisplayName("TestUser")).toBeVisible();
        expect(elements.getProfileSteamId("76561198012345678")).toBeVisible();
      });
    });

    it("should display error message on failed connection", async () => {
      server.use(
        http.post("/api/steam/connect", () => {
          return HttpResponse.json(
            { error: "Invalid Steam ID" },
            { status: 400 }
          );
        })
      );

      render(<SteamConnectCard />);

      await actions.typeAndSubmit("invalid");

      await waitFor(() => {
        expect(elements.getErrorMessage(/invalid steam id/i)).toBeVisible();
      });
    });

    it("should display network error on fetch failure", async () => {
      server.use(
        http.post("/api/steam/connect", () => {
          return HttpResponse.error();
        })
      );

      render(<SteamConnectCard />);

      await actions.typeAndSubmit("76561198012345678");

      await waitFor(() => {
        expect(
          elements.getErrorMessage(/network error\. please try again\./i)
        ).toBeVisible();
      });
    });

    describe("given URL search params", () => {
      it.each([
        {
          params: { steam: "connected" },
          expectedToast: {
            type: "success" as const,
            message: "Steam account connected successfully!",
          },
        },
        {
          params: { steam: "error", reason: "unauthorized" },
          expectedToast: {
            type: "error" as const,
            message: "You must be logged in to connect Steam",
          },
        },
        {
          params: { steam: "error", reason: "validation" },
          expectedToast: {
            type: "error" as const,
            message: "Steam authentication failed. Please try again.",
          },
        },
        {
          params: { steam: "error", reason: "profile" },
          expectedToast: {
            type: "error" as const,
            message: "Could not fetch your Steam profile. Please try again.",
          },
        },
        {
          params: { steam: "error", reason: "server" },
          expectedToast: {
            type: "error" as const,
            message: "An unexpected error occurred. Please try again.",
          },
        },
        {
          params: { steam: "error", reason: "unknown" },
          expectedToast: {
            type: "error" as const,
            message: "Failed to connect Steam account",
          },
        },
        {
          params: { steam: "error" },
          expectedToast: {
            type: "error" as const,
            message: "Failed to connect Steam account",
          },
        },
      ])(
        "should show $expectedToast.type toast when URL has steam=$params.steam and reason=$params.reason",
        ({ params, expectedToast }) => {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              mockSearchParams.set(key, value);
            }
          });

          render(<SteamConnectCard />);

          expect(toast[expectedToast.type]).toHaveBeenCalledWith(
            expectedToast.message
          );
        }
      );
    });
  });

  describe("given connected state", () => {
    it("should display connected profile information", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(elements.getConnectedTitle()).toBeVisible();
      expect(elements.getProfileDisplayName("ConnectedUser")).toBeVisible();
      expect(elements.getProfileSteamId("76561198012345678")).toBeVisible();
      expect(elements.getProfileAvatar("ConnectedUser")).toHaveAttribute(
        "src",
        "https://example.com/avatar.jpg"
      );
    });

    it("should display disconnect button", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(elements.getDisconnectButton()).toBeVisible();
    });

    it("should open confirmation dialog when disconnect is clicked", async () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      await actions.clickDisconnect();

      expect(elements.getDialogTitle()).toBeVisible();
      expect(elements.getDialogDescription()).toBeVisible();
    });

    it("should close dialog when cancel button is clicked", async () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      await actions.clickDisconnect();
      await actions.clickDialogCancel();

      await waitFor(() => {
        expect(elements.queryDialogTitle()).not.toBeInTheDocument();
      });
    });

    it("should call disconnect action and update UI on successful disconnect", async () => {
      vi.mocked(disconnectSteam).mockResolvedValue({
        success: true,
        data: undefined,
      });

      render(<SteamConnectCard initialStatus={connectedStatus} />);

      await actions.clickDisconnect();
      await actions.clickDialogConfirmDisconnect();

      await waitFor(() => {
        expect(disconnectSteam).toHaveBeenCalledWith({});
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Steam account disconnected successfully"
        );
      });

      await waitFor(() => {
        expect(elements.queryConnectedTitle()).not.toBeInTheDocument();
        expect(elements.getCardTitle()).toBeVisible();
      });
    });

    it("should show error toast when disconnect fails", async () => {
      const errorMessage = "Failed to disconnect Steam account";
      vi.mocked(disconnectSteam).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      render(<SteamConnectCard initialStatus={connectedStatus} />);

      await actions.clickDisconnect();
      await actions.clickDialogConfirmDisconnect();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      expect(elements.getProfileDisplayName("ConnectedUser")).toBeVisible();
    });

    it("should show loading state during disconnect", async () => {
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

      await actions.clickDisconnect();

      const dialog = elements.getDialog();
      const confirmButton = within(dialog).getAllByRole("button", {
        name: /disconnect/i,
      })[0];

      await userEvent.click(confirmButton);

      expect(confirmButton).toBeDisabled();
      expect(
        within(dialog).getByRole("button", { name: /cancel/i })
      ).toBeDisabled();
    });

    it("should preserve imported games message in disconnect dialog", async () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      await actions.clickDisconnect();

      expect(elements.getImportedGamesMessage()).toBeVisible();
    });

    it("should not display the form when connected", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      expect(elements.querySteamIdInput()).not.toBeInTheDocument();
    });

    it("should display manage imported games link when connected", () => {
      render(<SteamConnectCard initialStatus={connectedStatus} />);

      const manageLink = elements.getManageImportedGamesLink();
      expect(manageLink).toBeVisible();
      expect(manageLink).toHaveAttribute("href", "/steam/games");
    });
  });
});
