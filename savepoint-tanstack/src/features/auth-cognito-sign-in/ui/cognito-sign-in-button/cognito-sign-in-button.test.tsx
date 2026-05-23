import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/shared/api/auth-client";

import { CognitoSignInButton } from "./cognito-sign-in-button";

vi.mock("@/shared/api/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
  signIn: {
    social: vi.fn(),
  },
}));

const elements = {
  getSocialProviderButton: (name: string) =>
    screen.getByRole("button", { name }),
};

const actions = {
  clickSocialProviderButton: async (name: string) => {
    const button = elements.getSocialProviderButton(name);
    await userEvent.click(button);
  },
};

describe("CognitoSignInButton", () => {
  describe("given user clicked on Sign in with Cognito button", () => {
    beforeEach(async () => {
      render(<CognitoSignInButton />);

      await actions.clickSocialProviderButton("Sign in with Cognito");
    });
    it("calls authClient.signIn.social with provider cognito", async () => {
      expect(vi.mocked(authClient.signIn.social)).toHaveBeenCalledWith(
        expect.objectContaining({ provider: "cognito" })
      );
    });
  });
});
