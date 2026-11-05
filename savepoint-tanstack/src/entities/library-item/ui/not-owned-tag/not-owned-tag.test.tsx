import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NotOwnedTag } from "./not-owned-tag";

describe("NotOwnedTag", () => {
  it("reads 'Not owned' for a Want game the user does not own", () => {
    render(<NotOwnedTag status="WANT" isOwned={false} />);
    expect(screen.getByText("Not owned")).toBeDefined();
  });

  it("shows nothing for an owned Want game", () => {
    const { container } = render(<NotOwnedTag status="WANT" isOwned />);
    expect(container.textContent).toBe("");
  });

  it.each(["PLAYING", "DONE"] as const)(
    "shows nothing for a not-owned %s game",
    (status) => {
      const { container } = render(
        <NotOwnedTag status={status} isOwned={false} />
      );
      expect(container.textContent).toBe("");
    }
  );
});
