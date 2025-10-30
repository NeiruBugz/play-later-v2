import { render, screen } from "@testing-library/react";

import { GoogleSignInButton } from "./google-sign-in-button";

const elements = {
  getSignInWithGoogleButton: () =>
    screen.getByRole("button", { name: "Sign in with Google" }),
};

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    render(<GoogleSignInButton />);
  });
  it("should render the Google sign-in button", () => {
    expect(elements.getSignInWithGoogleButton()).toBeVisible();
  });
});
