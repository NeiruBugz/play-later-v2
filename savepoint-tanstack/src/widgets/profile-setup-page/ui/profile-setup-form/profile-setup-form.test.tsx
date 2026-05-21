import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateProfileFn } from "@/features/edit-profile";

import { ProfileSetupForm } from "./profile-setup-form";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate }),
}));

vi.mock("@/features/edit-profile", () => ({
  updateProfileFn: vi.fn(),
  // Stub UsernameInput as a plain controlled input so the widget test stays
  // focused on pre-fill + submit + navigate behaviour. The live
  // availability/debounce machinery has its own coverage in edit-profile.
  UsernameInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <label>
      Username
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  ),
}));

vi.mock("@/features/upload-avatar", () => ({
  AvatarUpload: () => <div data-testid="avatar-upload" />,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const elements = {
  getUsernameInput: () => screen.getByLabelText("Username"),
  getCompleteButton: () =>
    screen.getByRole("button", { name: "Complete setup" }),
  getServerError: () => screen.getByRole("alert"),
};

const actions = {
  setUsername: async (value: string) => {
    await userEvent.clear(elements.getUsernameInput());
    await userEvent.type(elements.getUsernameInput(), value);
  },
  submit: () => userEvent.click(elements.getCompleteButton()),
};

describe("ProfileSetupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a suggested username is provided", () => {
    beforeEach(() => {
      render(<ProfileSetupForm defaultUsername="adalovelace" />);
    });

    it("pre-fills the username field with the suggestion", () => {
      expect(elements.getUsernameInput()).toHaveValue("adalovelace");
    });
  });

  describe("given the suggested username is submitted unchanged", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockResolvedValue({
        id: "u1",
        name: "Ada Lovelace",
        username: "adalovelace",
        image: null,
        isPublicProfile: false,
      });

      render(<ProfileSetupForm defaultUsername="adalovelace" />);
      await actions.submit();
    });

    it("persists the suggested username via updateProfileFn", () => {
      expect(vi.mocked(updateProfileFn)).toHaveBeenCalledWith({
        data: { username: "adalovelace" },
      });
    });

    it("navigates to the dashboard on success", () => {
      expect(navigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });
  });

  describe("given the user edits the username before submitting", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockResolvedValue({
        id: "u1",
        name: "Ada Lovelace",
        username: "ada",
        image: null,
        isPublicProfile: false,
      });

      render(<ProfileSetupForm defaultUsername="adalovelace" />);
      await actions.setUsername("ada-the-coder");
      await actions.submit();
    });

    it("persists the edited username", () => {
      expect(vi.mocked(updateProfileFn)).toHaveBeenCalledWith({
        data: { username: "ada-the-coder" },
      });
    });
  });

  describe("given the server fn rejects", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockRejectedValue(
        new Error("Username is already taken")
      );

      render(<ProfileSetupForm defaultUsername="adalovelace" />);
      await actions.submit();
    });

    it("surfaces the error message inline", () => {
      expect(elements.getServerError().textContent).toContain(
        "Username is already taken"
      );
    });

    it("does not navigate away", () => {
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
