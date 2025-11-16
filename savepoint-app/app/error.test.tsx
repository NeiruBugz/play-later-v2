import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import GlobalError from "./error";

describe("GlobalError (Error Boundary)", () => {
  const mockError = new Error("Test error message");
  const mockReset = vi.fn();

  it("should render error heading", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole("heading", { name: /we hit an unexpected error/i })
    ).toBeVisible();
  });

  it("should display user-friendly error message", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(
      screen.getByText(/the action you tried didn't go as planned/i)
    ).toBeVisible();
  });

  it("should render 'Something went wrong' badge", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByText("Something went wrong")).toBeVisible();
  });

  it("should render 'Try again' button", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeVisible();
  });

  it("should render 'Back to home' link", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const homeLink = screen.getByRole("link", { name: /back to home/i });
    expect(homeLink).toBeVisible();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("should call reset function when 'Try again' button is clicked", async () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    await userEvent.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("should display error digest when present", () => {
    const errorWithDigest = Object.assign(mockError, {
      digest: "abc123def456",
    });
    render(<GlobalError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText("Error reference:")).toBeVisible();
    expect(screen.getByText("abc123def456")).toBeVisible();
  });

  it("should display 'N/A' when error digest is not present", () => {
    const errorWithoutDigest = new Error("Test error without digest");
    render(<GlobalError error={errorWithoutDigest} reset={mockReset} />);

    expect(screen.getByText("Error reference:")).toBeVisible();
    // Look for the text content including "N/A"
    expect(
      screen.getByText((content) => content.includes("N/A"))
    ).toBeVisible();
  });

  it("should have accessible shield alert icon", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const icon = screen.getByTestId("error-shield-icon");
    expect(icon).toBeVisible();
  });

  it("should render BrowserBackButton component", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    // BrowserBackButton contains "Back" text
    const backButton = screen.getByRole("button", { name: /back/i });
    expect(backButton).toBeVisible();
  });
});
