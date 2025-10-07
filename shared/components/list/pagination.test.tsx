import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Pagination } from "./pagination";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams("search=doom&page=3"),
  usePathname: () => "/backlog",
}));

describe("Pagination", () => {
  it("renders and updates page via router.replace", () => {
    render(<Pagination total={240} pageSize={24} />);

    const firstBtn = screen.getAllByRole("button")[0];
    fireEvent.click(firstBtn);
    expect(replaceMock).toHaveBeenCalledWith("/backlog?search=doom&page=1");
  });
});
