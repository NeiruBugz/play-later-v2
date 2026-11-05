import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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
    expect(footer).toHaveClass(
      "max-md:fixed",
      "max-md:inset-x-0",
      "max-md:bottom-0"
    );
    expect(footer).not.toHaveClass("fixed");
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

  describe("reserved space", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it("reserves the footer's height in the flow so it never covers content", () => {
      vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
        height: 72,
      } as DOMRect);
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(private readonly callback: () => void) {}
          observe() {
            this.callback();
          }
          disconnect() {}
        }
      );

      const { container } = render(
        <StickyFooter>
          <button type="button">Save</button>
        </StickyFooter>
      );

      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
      const spacer = container.querySelector(
        '[data-slot="sticky-footer-spacer"]'
      ) as HTMLElement;
      expect(spacer).toHaveStyle({ height: "72px" });
      expect(spacer).toHaveAttribute("aria-hidden", "true");
    });
  });
});
