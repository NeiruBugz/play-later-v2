import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button asChild", () => {
  it("renders the child link with button classes and no button role", () => {
    render(
      <Button asChild variant="outline">
        <a href="/library">Library</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Library" });
    expect(link).toHaveAttribute("href", "/library");
    expect(link).toHaveClass("border-border");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
