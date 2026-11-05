import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StickyFooter } from "./sticky-footer";

describe("StickyFooter", () => {
  it("keeps its primary action reachable by role", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <StickyFooter>
          <button type="submit">Save</button>
        </StickyFooter>
      </form>
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("pins to the phone viewport edge and goes inline from md up", () => {
    render(
      <StickyFooter>
        <button type="button">Save</button>
      </StickyFooter>
    );

    const footer = screen.getByRole("button", { name: "Save" })
      .parentElement as HTMLElement; // eslint-disable-line testing-library/no-node-access
    expect(footer).toHaveAttribute("data-slot", "sticky-footer");
    expect(footer).toHaveClass("max-md:sticky", "max-md:bottom-0");
    expect(footer).not.toHaveClass("sticky");
  });

  it("pins above the bottom nav when the nav is visible", () => {
    render(
      <StickyFooter aboveBottomNav>
        <button type="button">Save</button>
      </StickyFooter>
    );

    const footer = screen.getByRole("button", { name: "Save" })
      .parentElement as HTMLElement; // eslint-disable-line testing-library/no-node-access
    expect(footer).toHaveClass("max-md:bottom-(--bottom-nav-height)");
  });
});
