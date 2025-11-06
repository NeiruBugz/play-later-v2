import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import GlobalError from "./global-error";

describe("GlobalError (Root Error Boundary)", () => {
  const mockError = new Error("Critical test error");
  const mockReset = vi.fn();

  // Mock window.location.reload
  const originalLocation = window.location;
  beforeEach(() => {
    // @ts-expect-error - mocking location
    delete window.location;
    // @ts-expect-error - mocking location
    window.location = { ...originalLocation, reload: vi.fn() };
  });

  afterEach(() => {
    // @ts-expect-error - restoring location
    window.location = originalLocation;
  });

  it("should render main content area", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const main = screen.getByRole("main");
    expect(main).toBeInTheDocument();
  });

  it("should render critical error heading", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(
      screen.getByRole("heading", { name: /something went critically wrong/i })
    ).toBeVisible();
  });

  it("should display critical error message", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(
      screen.getByText(/a critical error occurred in the application/i)
    ).toBeVisible();
  });

  it("should render 'Critical Error' badge", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    expect(screen.getByText("Critical Error")).toBeVisible();
  });

  it("should render 'Refresh page' button", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const refreshButton = screen.getByRole("button", { name: /refresh page/i });
    expect(refreshButton).toBeVisible();
  });

  it("should render 'Try again' button", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    expect(tryAgainButton).toBeVisible();
  });

  it("should call window.location.reload when 'Refresh page' button is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalError error={mockError} reset={mockReset} />);

    const refreshButton = screen.getByRole("button", { name: /refresh page/i });
    await user.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalledOnce();
  });

  it("should call reset function when 'Try again' button is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalError error={mockError} reset={mockReset} />);

    const tryAgainButton = screen.getByRole("button", { name: /try again/i });
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("should display error digest when present", () => {
    const errorWithDigest = Object.assign(mockError, {
      digest: "xyz789abc123",
    });
    render(<GlobalError error={errorWithDigest} reset={mockReset} />);

    expect(screen.getByText("Error reference:")).toBeVisible();
    expect(screen.getByText("xyz789abc123")).toBeVisible();
  });

  it("should not display error reference section when digest is missing", () => {
    const errorWithoutDigest = new Error("Test error");
    render(<GlobalError error={errorWithoutDigest} reset={mockReset} />);

    expect(screen.queryByText("Error reference:")).not.toBeInTheDocument();
  });

  it("should have accessible shield alert icon", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    const icon = screen.getByTestId("global-error-shield-icon");
    expect(icon).toBeVisible();
  });

  it("should render all critical UI elements", () => {
    render(<GlobalError error={mockError} reset={mockReset} />);

    // Verify all critical elements are present
    expect(screen.getByText("Critical Error")).toBeVisible();
    expect(screen.getByRole("button", { name: /refresh page/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /try again/i })).toBeVisible();
  });
});
