import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ReadonlyURLSearchParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

import { HeroSearch } from "./hero-search";

const createNavigationMock = (initialQuery = "") => {
  let currentParams = new URLSearchParams(initialQuery);

  const mockPush = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  const mockReplace = vi.fn((url: string) => {
    const urlObj = new URL(url, "http://localhost");
    currentParams = urlObj.searchParams;
  });

  vi.mocked(useRouter).mockReturnValue({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as ReturnType<typeof useRouter>);

  vi.mocked(useSearchParams).mockImplementation(
    () => currentParams as ReadonlyURLSearchParams
  );

  return { mockPush, mockReplace, getParams: () => currentParams };
};

describe("HeroSearch", () => {
  beforeEach(() => {
    createNavigationMock();
  });

  it("renders an input with the expected aria-label and placeholder", () => {
    render(<HeroSearch />);

    const input = screen.getByRole("searchbox", {
      name: "Filter library by title",
    });
    expect(input).toBeVisible();
    expect(input).toHaveAttribute("placeholder", "Filter library...");
  });

  it("initializes the input with the search param from the URL", () => {
    createNavigationMock("search=zelda");

    render(<HeroSearch />);

    const input = screen.getByRole("searchbox", {
      name: "Filter library by title",
    });
    expect(input).toHaveValue("zelda");
  });

  it("calls router.push with merged search param after debounce", async () => {
    const { mockPush } = createNavigationMock();
    render(<HeroSearch />);

    const input = screen.getByRole("searchbox", {
      name: "Filter library by title",
    });

    mockPush.mockClear();
    await userEvent.type(input, "witcher");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("search=witcher"),
        expect.objectContaining({ scroll: false })
      );
    });
  });

  it("focuses input when '/' is pressed and no input is focused", async () => {
    render(<HeroSearch />);

    const input = screen.getByRole("searchbox", {
      name: "Filter library by title",
    });
    expect(input).not.toHaveFocus();

    const event = new KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("does not steal focus when '/' is pressed while another input is focused", async () => {
    render(
      <>
        <input data-testid="other-input" aria-label="other" />
        <HeroSearch />
      </>
    );

    const otherInput = screen.getByTestId("other-input");
    const heroInput = screen.getByRole("searchbox", {
      name: "Filter library by title",
    });
    otherInput.focus();
    expect(otherInput).toHaveFocus();

    const event = new KeyboardEvent("keydown", {
      key: "/",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);

    await Promise.resolve();
    expect(heroInput).not.toHaveFocus();
    expect(otherInput).toHaveFocus();
    expect(event.defaultPrevented).toBe(false);
  });

  it("renders the '/' keyboard shortcut chip after mount", async () => {
    render(<HeroSearch />);

    await waitFor(() => {
      const chip = screen.getByText("/");
      expect(chip).toBeVisible();
    });
  });
});
