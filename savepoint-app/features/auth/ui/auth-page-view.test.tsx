import { render, screen } from "@testing-library/react";

import { AuthPageView } from "./auth-page-view";

vi.mock("@/env.mjs", () => ({
  env: {
    NODE_ENV: "test",
    AUTH_ENABLE_CREDENTIALS: "false",
  },
}));

vi.mock("../server-actions/sign-in", () => ({
  signInAction: vi.fn(),
}));

vi.mock("../server-actions/sign-up", () => ({
  signUpAction: vi.fn(),
}));

vi.mock("../server-actions/sign-in-google", () => ({
  signInWithGoogleAction: vi.fn(),
}));

describe("AuthPageView", () => {
  it("renders the SavePoint brand mark", () => {
    render(<AuthPageView />);
    expect(screen.getByText("SavePoint")).toBeInTheDocument();
  });

  it("does not contain the old tagline", () => {
    render(<AuthPageView />);
    expect(
      screen.queryByText(/manage your gaming experiences/i)
    ).not.toBeInTheDocument();
  });

  it("renders the Google sign-in control", () => {
    render(<AuthPageView />);
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it("renders email and password form fields in non-production mode", () => {
    render(<AuthPageView />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });
});
