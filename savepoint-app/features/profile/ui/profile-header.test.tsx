import { render, screen } from "@testing-library/react";

import { FollowButton } from "@/features/social";

import { ProfileHeader } from "./profile-header";

vi.mock("@/features/social", () => ({
  FollowButton: vi.fn(() => <button>Follow</button>),
}));

vi.mock("./logout-button", () => ({
  LogoutButton: vi.fn(() => <button>Logout</button>),
}));

const mockFollowButton = vi.mocked(FollowButton);

const BASE_PROFILE: {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  isPublicProfile: boolean;
  email?: string | null;
} = {
  id: "user-abc",
  username: "gamer42",
  name: "Gamer Fortytwo",
  image: "https://example.com/avatar.jpg",
  isPublicProfile: true,
};

const BASE_SOCIAL_COUNTS = {
  followers: 128,
  following: 64,
};

function renderProfileHeader(overrides?: {
  profile?: Partial<typeof BASE_PROFILE>;
  socialCounts?: Partial<typeof BASE_SOCIAL_COUNTS>;
  viewer?: {
    isOwner: boolean;
    isAuthenticated: boolean;
    isFollowing?: boolean;
  };
}) {
  const props = {
    profile: { ...BASE_PROFILE, ...overrides?.profile },
    socialCounts: { ...BASE_SOCIAL_COUNTS, ...overrides?.socialCounts },
    viewer: overrides?.viewer ?? {
      isOwner: false,
      isAuthenticated: false,
    },
  };

  return render(<ProfileHeader {...props} />);
}

describe("ProfileHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given any viewer", () => {
    it("renders the avatar image with the profile image src", () => {
      renderProfileHeader();

      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute("src", BASE_PROFILE.image);
    });

    it("renders the avatar with alt text derived from the display name", () => {
      renderProfileHeader();

      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute(
        "alt",
        expect.stringContaining(BASE_PROFILE.name!)
      );
    });

    it("renders a fallback avatar when image is null, using username for alt text", () => {
      renderProfileHeader({ profile: { image: null } });

      const avatar = screen.getByRole("img");
      expect(avatar).toHaveAttribute(
        "alt",
        expect.stringContaining(BASE_PROFILE.username)
      );
    });

    it("renders the display name", () => {
      renderProfileHeader();

      expect(screen.getByText(BASE_PROFILE.name!)).toBeInTheDocument();
    });

    it("renders the @username", () => {
      renderProfileHeader();

      expect(screen.getByText(`@${BASE_PROFILE.username}`)).toBeInTheDocument();
    });

    it("renders the follower count", () => {
      renderProfileHeader();

      expect(screen.getByText("128")).toBeInTheDocument();
    });

    it("renders the following count", () => {
      renderProfileHeader();

      expect(screen.getByText("64")).toBeInTheDocument();
    });

    it("links the follower count to the followers page", () => {
      renderProfileHeader();

      const followersLink = screen.getByRole("link", {
        name: /128|followers/i,
      });
      expect(followersLink).toHaveAttribute(
        "href",
        `/u/${BASE_PROFILE.username}/followers`
      );
    });

    it("links the following count to the following page", () => {
      renderProfileHeader();

      const followingLink = screen.getByRole("link", { name: /64|following/i });
      expect(followingLink).toHaveAttribute(
        "href",
        `/u/${BASE_PROFILE.username}/following`
      );
    });
  });

  describe("given an authenticated visitor who is not the owner, on a public profile", () => {
    it("renders FollowButton", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: true, isFollowing: false },
      });

      expect(
        screen.getByRole("button", { name: "Follow" })
      ).toBeInTheDocument();
    });

    it("passes the profile id as followingId to FollowButton", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: true, isFollowing: false },
      });

      expect(mockFollowButton).toHaveBeenCalledWith(
        expect.objectContaining({ followingId: BASE_PROFILE.id }),
        undefined
      );
    });

    it("passes initialIsFollowing false when not following", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: true, isFollowing: false },
      });

      expect(mockFollowButton).toHaveBeenCalledWith(
        expect.objectContaining({ initialIsFollowing: false }),
        undefined
      );
    });

    it("passes initialIsFollowing true when already following", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: true, isFollowing: true },
      });

      expect(mockFollowButton).toHaveBeenCalledWith(
        expect.objectContaining({ initialIsFollowing: true }),
        undefined
      );
    });
  });

  describe("given a visitor viewing a private profile", () => {
    it("does not render FollowButton", () => {
      renderProfileHeader({
        profile: { isPublicProfile: false },
        viewer: { isOwner: false, isAuthenticated: true, isFollowing: false },
      });

      expect(
        screen.queryByRole("button", { name: /follow/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("given the owner viewing their own profile", () => {
    it("does not render FollowButton", () => {
      renderProfileHeader({
        viewer: { isOwner: true, isAuthenticated: true },
      });

      expect(
        screen.queryByRole("button", { name: /follow/i })
      ).not.toBeInTheDocument();
    });

    it("renders the owner email when provided", () => {
      renderProfileHeader({
        profile: { email: "gamer42@example.com" },
        viewer: { isOwner: true, isAuthenticated: true },
      });

      expect(screen.getByText("gamer42@example.com")).toBeInTheDocument();
    });

    it("renders an Edit Profile link pointing to /profile/settings", () => {
      renderProfileHeader({
        viewer: { isOwner: true, isAuthenticated: true },
      });

      const editLink = screen.getByRole("link", { name: /edit profile/i });
      expect(editLink).toHaveAttribute("href", "/profile/settings");
    });

    it("renders the Logout control", () => {
      renderProfileHeader({
        viewer: { isOwner: true, isAuthenticated: true },
      });

      expect(
        screen.getByRole("button", { name: /logout/i })
      ).toBeInTheDocument();
    });
  });

  describe("given an unauthenticated visitor", () => {
    it("does not render FollowButton", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: false },
      });

      expect(
        screen.queryByRole("button", { name: /follow/i })
      ).not.toBeInTheDocument();
    });

    it("does not render Edit Profile link", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: false },
      });

      expect(
        screen.queryByRole("link", { name: /edit profile/i })
      ).not.toBeInTheDocument();
    });

    it("does not render Logout control", () => {
      renderProfileHeader({
        viewer: { isOwner: false, isAuthenticated: false },
      });

      expect(
        screen.queryByRole("button", { name: /logout/i })
      ).not.toBeInTheDocument();
    });

    it("does not render owner email", () => {
      renderProfileHeader({
        profile: { email: "gamer42@example.com" },
        viewer: { isOwner: false, isAuthenticated: false },
      });

      expect(screen.queryByText("gamer42@example.com")).not.toBeInTheDocument();
    });
  });
});
