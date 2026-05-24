import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LogoutButton } from "./logout-button";

const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

const mockSignOut = vi.fn();

vi.mock("@/shared/api/auth-client", () => ({
  authClient: {
    signOut: (...args: unknown[]) => mockSignOut(...args),
  },
}));

const elements = {
  getSignOutButton: () => screen.getByRole("button", { name: "Sign out" }),
};

const actions = {
  clickSignOut: () => userEvent.click(elements.getSignOutButton()),
};

describe("LogoutButton", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
  });

  describe("given the component is rendered", () => {
    beforeEach(() => {
      render(<LogoutButton />);
    });

    it("renders the Sign out button", () => {
      expect(elements.getSignOutButton()).toBeDefined();
    });
  });

  describe("given the user clicks Sign out", () => {
    beforeEach(async () => {
      mockSignOut.mockImplementation(
        (opts: { fetchOptions?: { onSuccess?: () => void } }) => {
          opts?.fetchOptions?.onSuccess?.();
        }
      );
      render(<LogoutButton />);
      await actions.clickSignOut();
    });

    it("calls authClient.signOut", () => {
      expect(mockSignOut).toHaveBeenCalledOnce();
    });

    it("calls router.invalidate inside the onSuccess callback", () => {
      expect(mockRouterInvalidate).toHaveBeenCalledOnce();
    });
  });
});
