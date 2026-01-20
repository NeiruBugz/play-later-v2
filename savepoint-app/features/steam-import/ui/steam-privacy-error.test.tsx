import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamPrivacyError } from "./steam-privacy-error";

describe("SteamPrivacyError", () => {
  it("renders the error message", () => {
    const message = "Your Steam profile is set to private";
    render(<SteamPrivacyError message={message} />);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(
      screen.getByText("Steam Profile Privacy Settings")
    ).toBeInTheDocument();
  });

  it("renders step-by-step instructions", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(
      screen.getByText(/Visit your Steam Privacy Settings/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Set "Game details" to "Public"/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Return here and try again/i)).toBeInTheDocument();
  });

  it("renders a link to Steam privacy settings", () => {
    render(<SteamPrivacyError message="Test message" />);

    const link = screen.getByRole("link", { name: /Open Privacy Settings/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://steamcommunity.com/my/edit/settings"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("displays an external link icon", () => {
    render(<SteamPrivacyError message="Test message" />);

    const button = screen.getByRole("link", { name: /Open Privacy Settings/i });
    expect(button.querySelector("svg")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(<SteamPrivacyError message="Test message" onRetry={onRetry} />);

    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(
      screen.queryByRole("button", { name: /try again/i })
    ).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<SteamPrivacyError message="Test message" onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
