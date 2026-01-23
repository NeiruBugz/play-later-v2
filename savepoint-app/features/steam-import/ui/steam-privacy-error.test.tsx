import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SteamPrivacyError } from "./steam-privacy-error";

const elements = {
  getMessage: (msg: string) => screen.getByText(msg),
  getTitle: () => screen.getByText("Steam Profile Privacy Settings"),
  getVisitSettingsStep: () =>
    screen.getByText(/Visit your Steam Privacy Settings/i),
  getSetPublicStep: () => screen.getByText(/Set "Game details" to "Public"/i),
  getTryAgainStep: () => screen.getByText(/Return here and try again/i),
  getSettingsLink: () =>
    screen.getByRole("link", { name: /Open Privacy Settings/i }),
  getRetryButton: () => screen.getByRole("button", { name: /try again/i }),
  queryRetryButton: () => screen.queryByRole("button", { name: /try again/i }),
};

const actions = {
  clickRetry: async () => {
    await userEvent.click(elements.getRetryButton());
  },
};

describe("SteamPrivacyError", () => {
  it("renders the error message", () => {
    const message = "Your Steam profile is set to private";
    render(<SteamPrivacyError message={message} />);

    expect(elements.getMessage(message)).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(elements.getTitle()).toBeInTheDocument();
  });

  it("renders step-by-step instructions", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(elements.getVisitSettingsStep()).toBeInTheDocument();
    expect(elements.getSetPublicStep()).toBeInTheDocument();
    expect(elements.getTryAgainStep()).toBeInTheDocument();
  });

  it("renders a link to Steam privacy settings", () => {
    render(<SteamPrivacyError message="Test message" />);

    const link = elements.getSettingsLink();
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://steamcommunity.com/my/edit/settings"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders retry button when onRetry is provided", () => {
    const onRetry = vi.fn();

    render(<SteamPrivacyError message="Test message" onRetry={onRetry} />);

    expect(elements.getRetryButton()).toBeInTheDocument();
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<SteamPrivacyError message="Test message" />);

    expect(elements.queryRetryButton()).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", async () => {
    const onRetry = vi.fn();

    render(<SteamPrivacyError message="Test message" onRetry={onRetry} />);

    await actions.clickRetry();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
