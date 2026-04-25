import { render, screen } from "@testing-library/react";

import { getUpNextLabel } from "@/shared/lib/library-status";
import { LibraryItemStatus } from "@/shared/types";

import { LibraryStatusBadge } from "./library-status-badge";

describe("LibraryStatusBadge", () => {
  describe("given status PLAYING", () => {
    it("renders the Playing label and accessible status role", () => {
      render(<LibraryStatusBadge status={LibraryItemStatus.PLAYING} />);

      const badge = screen.getByLabelText(/Status: /);
      expect(badge).toHaveAttribute("aria-label", "Status: Playing");
      expect(badge).toHaveTextContent("Playing");
    });
  });

  describe("given status UP_NEXT and hasBeenPlayed=true", () => {
    it("renders the replay label from getUpNextLabel", () => {
      render(
        <LibraryStatusBadge status={LibraryItemStatus.UP_NEXT} hasBeenPlayed />
      );

      const expected = getUpNextLabel(true);
      expect(screen.getByLabelText(/Status: /)).toHaveTextContent(expected);
    });
  });

  describe("given status UP_NEXT and hasBeenPlayed=false", () => {
    it("renders the up-next label from getUpNextLabel", () => {
      render(
        <LibraryStatusBadge
          status={LibraryItemStatus.UP_NEXT}
          hasBeenPlayed={false}
        />
      );

      const expected = getUpNextLabel(false);
      expect(screen.getByLabelText(/Status: /)).toHaveTextContent(expected);
    });
  });

  describe("given hidden=true", () => {
    it("renders nothing", () => {
      render(<LibraryStatusBadge status={LibraryItemStatus.PLAYING} hidden />);

      expect(screen.queryByLabelText(/Status: /)).toBeNull();
      expect(screen.queryByTestId("library-status-badge-dot")).toBeNull();
    });
  });

  describe("accessibility — color is not the only signal", () => {
    it("renders both a color dot and a text label", () => {
      render(<LibraryStatusBadge status={LibraryItemStatus.SHELF} />);

      const badge = screen.getByLabelText(/Status: /);
      expect(badge).toHaveTextContent("Shelf");

      const dot = screen.getByTestId("library-status-badge-dot");
      expect(dot).toBeInTheDocument();
      expect(dot.style.backgroundColor).toBeTruthy();
    });
  });
});
