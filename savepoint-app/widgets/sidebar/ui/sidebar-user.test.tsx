import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarUser, SidebarUserSkeleton } from "./sidebar-user";

const mockGetDisplayProfile = vi.fn();

vi.mock("@/features/profile/index.server", () => ({
  getDisplayProfile: (...args: unknown[]) => mockGetDisplayProfile(...args),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...rest
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

vi.mock("./sidebar-user-menu", () => ({
  SidebarUserMenu: ({
    displayName,
    avatarUrl,
  }: {
    displayName: string;
    avatarUrl: string | null;
  }) => (
    <div data-testid="sidebar-user-menu">
      <span data-testid="display-name">{displayName}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatarUrl && <img src={avatarUrl} alt={displayName} />}
    </div>
  ),
}));

describe("SidebarUser", () => {
  it("renders the user display name and avatar when getDisplayProfile resolves", async () => {
    mockGetDisplayProfile.mockResolvedValueOnce({
      displayName: "gamer42",
      avatarUrl: "https://example.com/avatar.png",
    });

    render(await SidebarUser({ userId: "user-1" }));

    expect(screen.getByTestId("display-name")).toHaveTextContent("gamer42");
    expect(screen.getByRole("img", { name: "gamer42" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png"
    );
  });

  it("renders default 'User' name and no avatar when getDisplayProfile returns defaults", async () => {
    mockGetDisplayProfile.mockResolvedValueOnce({
      displayName: "User",
      avatarUrl: null,
    });

    render(await SidebarUser({ userId: "missing-user" }));

    expect(screen.getByTestId("display-name")).toHaveTextContent("User");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("SidebarUserSkeleton", () => {
  it("renders without crashing", () => {
    expect(() => render(<SidebarUserSkeleton />)).not.toThrow();
  });
});
