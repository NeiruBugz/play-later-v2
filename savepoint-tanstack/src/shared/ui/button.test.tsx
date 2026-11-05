import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buttonVariants } from "./button";

describe("buttonVariants on a link", () => {
  it("renders the child link with button classes and no button role", () => {
    render(
      <a href="/library" className={buttonVariants({ variant: "outline" })}>
        Library
      </a>
    );

    const link = screen.getByRole("link", { name: "Library" });
    expect(link).toHaveAttribute("href", "/library");
    expect(link).toHaveClass("border-border");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
