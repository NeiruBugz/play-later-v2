import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Profile } from "@/entities/profile/model/types";

import { ProfileHeader } from "./profile-header";

const stubProfile: Profile = {
  id: "user-stub-1",
  name: "Stub User",
  username: "stubuser",
  image: null,
  isPublicProfile: false,
};

const elements = {
  getDisplayName: (name: string) => screen.getByRole("heading", { name }),
  getUsernameText: (username: string) => screen.getByText(`@${username}`),
  getAvatarImage: (name: string) => screen.getByRole("img", { name }),
  queryAvatarOverlay: () => screen.queryByTestId("avatar-overlay-slot"),
};

describe("ProfileHeader", () => {
  describe("given a profile with display name and username and image", () => {
    beforeEach(() => {
      render(<ProfileHeader profile={stubProfile} />);
    });

    it("renders the display name as a heading", () => {
      elements.getDisplayName("Stub User");
    });

    it("renders the username with @ prefix", () => {
      elements.getUsernameText("stubuser");
    });

    it("renders the avatar image with the user name as alt text", () => {
      elements.getAvatarImage("Stub User");
    });
  });

  describe("given an avatarOverlay slot is provided", () => {
    beforeEach(() => {
      render(
        <ProfileHeader
          profile={stubProfile}
          avatarOverlay={<div data-testid="avatar-overlay-slot">overlay</div>}
        />
      );
    });

    it("renders the overlay slot near the avatar", () => {
      expect(elements.queryAvatarOverlay()).not.toBeNull();
    });
  });

  describe("given no avatarOverlay slot is provided", () => {
    beforeEach(() => {
      render(<ProfileHeader profile={stubProfile} />);
    });

    it("does not render the overlay slot", () => {
      expect(elements.queryAvatarOverlay()).toBeNull();
    });
  });
});
