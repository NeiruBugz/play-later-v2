import type { FollowUserProfile } from "@/data-access-layer/repository";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FollowersList } from "./followers-list";
import { FollowingList } from "./following-list";
import { UserListItem } from "./user-list-item";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const userWithAll: FollowUserProfile = {
  id: "user-1",
  name: "Alice Smith",
  username: "alicesmith",
  image: "https://example.com/alice.jpg",
};

const userWithoutImage: FollowUserProfile = {
  id: "user-2",
  name: "Bob Jones",
  username: "bobjones",
  image: null,
};

const userWithoutUsername: FollowUserProfile = {
  id: "user-3",
  name: "Charlie Brown",
  username: null,
  image: null,
};

const userWithoutName: FollowUserProfile = {
  id: "user-4",
  name: null,
  username: "dave42",
  image: null,
};

describe("FollowersList", () => {
  describe("given an empty followers list", () => {
    it("renders the empty state message", () => {
      render(<FollowersList users={[]} total={0} />);

      expect(screen.getByText("No followers yet.")).toBeInTheDocument();
    });

    it("does not render a follower count", () => {
      render(<FollowersList users={[]} total={0} />);

      expect(screen.queryByText("follower")).not.toBeInTheDocument();
      expect(screen.queryByText("followers")).not.toBeInTheDocument();
    });
  });

  describe("given a single follower", () => {
    it("renders singular 'follower' label", () => {
      render(<FollowersList users={[userWithAll]} total={1} />);

      expect(screen.getByText("follower")).toBeInTheDocument();
    });

    it("displays the total count", () => {
      render(<FollowersList users={[userWithAll]} total={1} />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("given multiple followers", () => {
    it("renders plural 'followers' label", () => {
      render(
        <FollowersList users={[userWithAll, userWithoutImage]} total={2} />
      );

      expect(screen.getByText("followers")).toBeInTheDocument();
    });

    it("renders one list item per user", () => {
      render(
        <FollowersList users={[userWithAll, userWithoutImage]} total={2} />
      );

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  describe("given a follower with an image", () => {
    it("renders the avatar image with accessible alt text", () => {
      render(<FollowersList users={[userWithAll]} total={1} />);

      const img = screen.getByAltText("Alice Smith's avatar");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "https://example.com/alice.jpg");
    });
  });

  describe("given a follower without an image", () => {
    it("renders the initials fallback avatar", () => {
      render(<FollowersList users={[userWithoutImage]} total={1} />);

      expect(screen.getByText("B")).toBeInTheDocument();
    });
  });

  describe("given a follower with a username", () => {
    it("renders a link to their profile", () => {
      render(<FollowersList users={[userWithAll]} total={1} />);

      const link = screen.getByRole("link", { name: /Alice Smith/i });
      expect(link).toHaveAttribute("href", "/u/alicesmith");
    });

    it("renders the @username handle", () => {
      render(<FollowersList users={[userWithAll]} total={1} />);

      expect(screen.getByText("@alicesmith")).toBeInTheDocument();
    });
  });

  describe("given a follower without a username", () => {
    it("does not link to a real profile path", () => {
      render(<FollowersList users={[userWithoutUsername]} total={1} />);

      const link = screen.getByRole("link", { name: /Charlie Brown/i });
      expect(link).toHaveAttribute("href", "#");
    });

    it("does not render a @username handle", () => {
      render(<FollowersList users={[userWithoutUsername]} total={1} />);

      expect(
        screen.queryByText((text) => text.startsWith("@"))
      ).not.toBeInTheDocument();
    });
  });
});

describe("FollowingList", () => {
  describe("given an empty following list", () => {
    it("renders the empty state message", () => {
      render(<FollowingList users={[]} total={0} />);

      expect(screen.getByText("Not following anyone yet.")).toBeInTheDocument();
    });
  });

  describe("given users being followed", () => {
    it("renders the 'following' label", () => {
      render(<FollowingList users={[userWithAll]} total={1} />);

      expect(screen.getByText("following")).toBeInTheDocument();
    });

    it("displays the total count", () => {
      render(<FollowingList users={[userWithAll]} total={1} />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("renders one list item per user", () => {
      render(
        <FollowingList users={[userWithAll, userWithoutImage]} total={2} />
      );

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  describe("given a followed user with an image", () => {
    it("renders the avatar image with accessible alt text", () => {
      render(<FollowingList users={[userWithAll]} total={1} />);

      const img = screen.getByAltText("Alice Smith's avatar");
      expect(img).toHaveAttribute("src", "https://example.com/alice.jpg");
    });
  });

  describe("given a followed user without an image", () => {
    it("renders the initials fallback avatar", () => {
      render(<FollowingList users={[userWithoutImage]} total={1} />);

      expect(screen.getByText("B")).toBeInTheDocument();
    });
  });

  describe("given a followed user with a username", () => {
    it("renders a link to their profile", () => {
      render(<FollowingList users={[userWithAll]} total={1} />);

      const link = screen.getByRole("link", { name: /Alice Smith/i });
      expect(link).toHaveAttribute("href", "/u/alicesmith");
    });

    it("renders the @username handle", () => {
      render(<FollowingList users={[userWithAll]} total={1} />);

      expect(screen.getByText("@alicesmith")).toBeInTheDocument();
    });
  });

  describe("given a followed user without a username", () => {
    it("does not link to a real profile path", () => {
      render(<FollowingList users={[userWithoutUsername]} total={1} />);

      const link = screen.getByRole("link", { name: /Charlie Brown/i });
      expect(link).toHaveAttribute("href", "#");
    });
  });
});

describe("UserListItem", () => {
  describe("given a user with a username", () => {
    it("wraps content in a link to the profile", () => {
      render(<UserListItem user={userWithAll} />);

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/u/alicesmith");
    });

    it("renders the display name", () => {
      render(<UserListItem user={userWithAll} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    });

    it("renders the @username handle", () => {
      render(<UserListItem user={userWithAll} />);

      expect(screen.getByText("@alicesmith")).toBeInTheDocument();
    });
  });

  describe("given a user with an image", () => {
    it("renders the avatar image", () => {
      render(<UserListItem user={userWithAll} />);

      const img = screen.getByAltText("Alice Smith's avatar");
      expect(img).toHaveAttribute("src", "https://example.com/alice.jpg");
    });
  });

  describe("given a user without an image", () => {
    it("renders the initial as fallback", () => {
      render(<UserListItem user={userWithoutImage} />);

      expect(screen.getByText("B")).toBeInTheDocument();
    });
  });

  describe("given a user without a username", () => {
    it("does not render a link", () => {
      render(<UserListItem user={userWithoutUsername} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("still renders the display name", () => {
      render(<UserListItem user={userWithoutUsername} />);

      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });
  });

  describe("given a user with only a username and no name", () => {
    it("uses the username as the display name", () => {
      render(<UserListItem user={userWithoutName} />);

      expect(screen.getByText("dave42")).toBeInTheDocument();
    });

    it("renders the initial from the username", () => {
      render(<UserListItem user={userWithoutName} />);

      expect(screen.getByText("D")).toBeInTheDocument();
    });
  });

  describe("given a user with neither name nor username", () => {
    it("falls back to 'Unknown' as display name", () => {
      const anonymousUser = {
        id: "user-5",
        name: null,
        username: null,
        image: null,
      };

      render(<UserListItem user={anonymousUser} />);

      expect(screen.getByText("Unknown")).toBeInTheDocument();
    });
  });
});
