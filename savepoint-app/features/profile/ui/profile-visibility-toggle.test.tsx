import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { updateProfile } from "@/features/profile/server-actions/update-profile";

import { ProfileVisibilityToggle } from "./profile-visibility-toggle";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock("@/features/profile/server-actions/update-profile", () => ({
  updateProfile: vi.fn(),
}));

const mockUpdateProfile = vi.mocked(updateProfile);
const mockToastError = vi.mocked(toast.error);

const DEFAULT_PROPS = {
  isPublicProfile: false,
  username: "testuser",
};

describe("ProfileVisibilityToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: { username: "testuser", image: null },
    });
  });

  describe("given isPublicProfile is false", () => {
    it("renders the switch in unchecked state", () => {
      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });
      expect(toggle).not.toBeChecked();
    });
  });

  describe("given isPublicProfile is true", () => {
    it("renders the switch in checked state", () => {
      render(
        <ProfileVisibilityToggle isPublicProfile={true} username="testuser" />
      );

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });
      expect(toggle).toBeChecked();
    });
  });

  describe("given the component renders", () => {
    it("displays the Public profile label", () => {
      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      expect(screen.getByText("Public profile")).toBeVisible();
    });

    it("displays the description text", () => {
      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      expect(
        screen.getByText(
          /Allow other users to see your profile and gaming activity/i
        )
      ).toBeVisible();
    });

    it("associates label with the switch via htmlFor", () => {
      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      const label = screen.getByText("Public profile");
      expect(label).toHaveAttribute("for", "public-profile-toggle");

      const toggle = screen.getByRole("switch");
      expect(toggle).toHaveAttribute("id", "public-profile-toggle");
    });
  });

  describe("given the user clicks the toggle", () => {
    it("calls updateProfile with the toggled value and username", async () => {
      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });

      await userEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          username: "testuser",
          isPublicProfile: true,
        });
      });
    });

    it("applies optimistic update immediately before server responds", async () => {
      let resolveAction!: (
        value: Awaited<ReturnType<typeof updateProfile>>
      ) => void;
      mockUpdateProfile.mockReturnValue(
        new Promise((resolve) => {
          resolveAction = resolve;
        })
      );

      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });

      await userEvent.click(toggle);

      expect(toggle).toBeChecked();

      resolveAction({
        success: true,
        data: { username: "testuser", image: null },
      });

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });
    });

    it("calls updateProfile with false when toggling off", async () => {
      render(
        <ProfileVisibilityToggle isPublicProfile={true} username="testuser" />
      );

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });

      await userEvent.click(toggle);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          username: "testuser",
          isPublicProfile: false,
        });
      });
    });
  });

  describe("given the server action fails", () => {
    it("shows an error toast with the failure message", async () => {
      mockUpdateProfile.mockResolvedValue({
        success: false,
        error: "Something went wrong",
      });

      render(<ProfileVisibilityToggle {...DEFAULT_PROPS} />);

      const toggle = screen.getByRole("switch", {
        name: /toggle public profile visibility/i,
      });

      await userEvent.click(toggle);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Failed to update profile visibility",
          { description: "Something went wrong" }
        );
      });
    });
  });
});
