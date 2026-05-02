import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

import { SectionBoundary } from "./section-boundary";

function Thrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <div>child-ok</div>;
}

describe("SectionBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("renders children when no error is thrown", () => {
    render(
      <SectionBoundary>
        <Thrower shouldThrow={false} />
      </SectionBoundary>
    );

    expect(screen.getByText("child-ok")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  it("renders fallback with retry button when child throws", () => {
    render(
      <SectionBoundary>
        <Thrower shouldThrow={true} />
      </SectionBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/couldn't load this section/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("re-mounts children when retry is clicked", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setShouldThrow(false)}>
            fix-it
          </button>
          <SectionBoundary>
            <Thrower shouldThrow={shouldThrow} />
          </SectionBoundary>
        </div>
      );
    }

    render(<Harness />);

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText("child-ok")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /fix-it/i }));
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(screen.getByText("child-ok")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });
});
