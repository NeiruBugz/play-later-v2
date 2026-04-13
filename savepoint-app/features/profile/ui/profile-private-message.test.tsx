import { render, screen } from "@testing-library/react";

import { ProfilePrivateMessage } from "./profile-private-message";

describe("ProfilePrivateMessage", () => {
  it("renders the private profile message text", () => {
    render(<ProfilePrivateMessage />);

    expect(screen.getByText(/this profile is private/i)).toBeInTheDocument();
  });

  it("renders with a status role so assistive technology announces it", () => {
    render(<ProfilePrivateMessage />);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has a visible heading that identifies the gated state", () => {
    render(<ProfilePrivateMessage />);

    expect(
      screen.getByRole("heading", { name: /private/i })
    ).toBeInTheDocument();
  });
});
