import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "@/entities/profile/model/types";

import { Route } from "./_authed/settings/profile";

vi.mock("@/features/edit-profile/api/get-profile-settings", () => ({
  getProfileSettingsFn: vi.fn(),
}));

vi.mock("@/features/edit-profile/ui/profile-settings-form", () => ({
  ProfileSettingsForm: () => <div data-testid="profile-settings-form-mock" />,
}));

vi.mock("@/features/upload-avatar", () => ({
  AvatarUpload: () => (
    <label data-testid="avatar-upload-mock">
      <span>Upload avatar</span>
      <input type="file" aria-label="Upload avatar" />
    </label>
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: () => ({
      profile: {
        id: "user-stub-1",
        name: "Stub User",
        username: "stubuser",
        image: null,
        isPublicProfile: false,
      } satisfies Profile,
    }),
  }),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

describe("settings/profile route", () => {
  describe("given the route component is rendered", () => {
    beforeEach(() => {
      const SettingsProfileComponent = Route.options.component as ComponentType;
      render(<SettingsProfileComponent />);
    });

    it("renders the profile settings form", () => {
      expect(screen.getByTestId("profile-settings-form-mock")).toBeDefined();
    });

    it("renders the avatar upload affordance", () => {
      expect(screen.getByTestId("avatar-upload-mock")).toBeDefined();
    });
  });
});
