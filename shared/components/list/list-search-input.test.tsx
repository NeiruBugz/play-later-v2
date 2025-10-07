import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { ListSearchInput } from "./search-input";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("page=3"),
  usePathname: () => "/collection/wishlist",
}));

describe("ListSearchInput", () => {
  it("updates search param and resets page", () => {
    render(<ListSearchInput placeholder="Search..." />);
    const input = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "metroid" } });
    expect(replaceMock).toHaveBeenCalledWith("?search=metroid");
  });
});
