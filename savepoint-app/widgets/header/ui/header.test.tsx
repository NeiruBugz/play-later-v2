import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Header } from "./header";

const openMock = vi.fn();
const closeMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...rest }: { alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...rest} />;
  },
}));

vi.mock("@/features/command-palette", () => ({
  CommandPalette: () => <div data-testid="command-palette" />,
  useCommandPaletteContext: () => ({
    isOpen: false,
    open: openMock,
    close: closeMock,
    toggle: vi.fn(),
  }),
}));

vi.mock("@/shared/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe("Header / Add Game trigger", () => {
  it("renders a single Add Game button (replacing any prior palette/Cmd+K trigger)", () => {
    render(<Header isAuthorised={true} />);

    const addGameButtons = screen.getAllByRole("button", {
      name: /add game/i,
    });
    expect(addGameButtons).toHaveLength(1);

    expect(
      screen.queryByRole("button", { name: /search games/i })
    ).not.toBeInTheDocument();
  });

  it("desktop variant exposes the visible 'Add Game' label", () => {
    render(<Header isAuthorised={true} />);
    const button = screen.getByRole("button", { name: /add game/i });
    const label = screen.getByText("Add Game");
    expect(button).toContainElement(label);
    expect(label.className).toMatch(/hidden/);
    expect(label.className).toMatch(/md:inline/);
  });

  it("mobile tap target is at least 44x44 (icon-only at <md)", () => {
    render(<Header isAuthorised={true} />);
    const button = screen.getByRole("button", { name: /add game/i });
    expect(button).toHaveAttribute("aria-label", "Add Game");
    expect(button.className).toMatch(/h-11/);
    expect(button.className).toMatch(/w-11/);
  });

  it("clicking the Add Game button calls useCommandPalette().open()", async () => {
    openMock.mockClear();
    const user = userEvent.setup();
    render(<Header isAuthorised={true} />);

    await user.click(screen.getByRole("button", { name: /add game/i }));

    expect(openMock).toHaveBeenCalledTimes(1);
  });

  it("does not render the Add Game trigger for unauthorised users", () => {
    render(<Header isAuthorised={false} />);
    expect(
      screen.queryByRole("button", { name: /add game/i })
    ).not.toBeInTheDocument();
  });
});
