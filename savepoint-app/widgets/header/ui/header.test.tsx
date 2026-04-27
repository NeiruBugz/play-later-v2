import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...rest }: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...rest} />;
  },
}));

vi.mock("@/shared/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe("Header (mobile/unauth top-bar)", () => {
  it("renders brand mark and theme toggle for authorised users", () => {
    render(<Header isAuthorised={true} />);

    expect(
      screen.getByRole("link", { name: /savepoint/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("does not render nav links for authorised users (desktop nav moved to sidebar)", () => {
    render(<Header isAuthorised={true} />);

    expect(
      screen.queryByRole("link", { name: /library/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /journal/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /timeline/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /profile/i })
    ).not.toBeInTheDocument();
  });

  it("does not render Add Game button for authorised users (moved to command palette)", () => {
    render(<Header isAuthorised={true} />);

    expect(
      screen.queryByRole("button", { name: /add game/i })
    ).not.toBeInTheDocument();
  });

  it("renders brand mark and theme toggle for unauthorised users", () => {
    render(<Header isAuthorised={false} />);

    expect(screen.getByText("SavePoint")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("does not render Add Game button for unauthorised users", () => {
    render(<Header isAuthorised={false} />);

    expect(
      screen.queryByRole("button", { name: /add game/i })
    ).not.toBeInTheDocument();
  });
});
