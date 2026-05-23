import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PublicUserRef } from "@/entities/follow/model";

import { UserList } from "./user-list";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string;
    params?: { username?: string };
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => {
    const href =
      params?.username !== undefined
        ? to.replace("$username", params.username)
        : to;
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

const userBob: PublicUserRef = {
  id: "user-bob",
  name: "Bob",
  username: "bob",
  image: null,
};

const userCarol: PublicUserRef = {
  id: "user-carol",
  name: null,
  username: "carol",
  image: "https://example.com/carol.jpg",
};

const elements = {
  queryEmpty: (variant: "followers" | "following") =>
    screen.queryByTestId(`user-list-empty-${variant}`),
  queryList: (variant: "followers" | "following") =>
    screen.queryByTestId(`user-list-${variant}`),
  getRows: () => screen.queryAllByTestId("user-list-item"),
  getBobLink: () => screen.getByRole("link", { name: /Bob/ }),
};

describe("UserList", () => {
  describe("given variant=followers and no entries", () => {
    beforeEach(() => {
      render(<UserList variant="followers" entries={[]} total={0} />);
    });

    it("renders the followers empty-state with the locked copy", () => {
      const empty = elements.queryEmpty("followers");
      expect(empty).not.toBeNull();
      expect(empty?.textContent).toContain("No followers yet");
    });
  });

  describe("given variant=following and no entries", () => {
    beforeEach(() => {
      render(<UserList variant="following" entries={[]} total={0} />);
    });

    it("renders the following empty-state with the locked copy", () => {
      const empty = elements.queryEmpty("following");
      expect(empty).not.toBeNull();
      expect(empty?.textContent).toContain("Not following anyone yet");
    });
  });

  describe("given two entries and variant=followers", () => {
    beforeEach(() => {
      render(
        <UserList
          variant="followers"
          entries={[userBob, userCarol]}
          total={2}
        />
      );
    });

    it("renders a row per entry", () => {
      expect(elements.getRows()).toHaveLength(2);
    });

    it("links each entry to its public profile by username", () => {
      const link = elements.getBobLink();
      expect(link).toHaveAttribute("href", "/u/bob");
    });

    it("shows the total count", () => {
      expect(elements.queryList("followers")?.textContent).toContain("2");
    });
  });
});
