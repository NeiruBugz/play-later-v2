import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthPageView } from "./auth-page-view";

vi.mock("./credentials-form", () => ({
  CredentialsForm: () => (
    <div data-testid="credentials-form">Credentials Form</div>
  ),
}));

vi.mock("./google-sign-in-button", () => ({
  GoogleSignInButton: () => <button>Sign in with Google</button>,
}));

const elements = {
  getAuthHeading: () => screen.getByText("Play Later"),
  getAuthSubtitle: () => screen.getByText("Manage your game backlog"),
  getCredentialsForm: () => screen.getByText("Credentials Form"),
  getSignInWithGoogleButton: () =>
    screen.getByRole("button", { name: "Sign in with Google" }),
  getDividerText: () => screen.getByText("Or continue with"),
};

describe("AuthPageView", () => {
  it("should display the heading and subtitle", () => {
    render(<AuthPageView />);
    expect(elements.getAuthHeading()).toBeVisible();
    expect(elements.getAuthSubtitle()).toBeVisible();
  });

  it("should display authentication methods with divider", () => {
    render(<AuthPageView />);
    expect(elements.getCredentialsForm()).toBeVisible();
    expect(elements.getDividerText()).toBeVisible();
    expect(elements.getSignInWithGoogleButton()).toBeVisible();
  });
});
