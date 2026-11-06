import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

const elements = {
  getAlert: () => screen.getByRole("alert"),
  queryAlert: () => screen.queryByRole("alert"),
};

describe("Alert", () => {
  describe("given default variant", () => {
    beforeEach(() => {
      render(
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>Something happened.</AlertDescription>
        </Alert>
      );
    });

    it("renders with role='alert'", () => {
      expect(elements.getAlert()).toBeDefined();
    });

    it("renders the title text", () => {
      expect(elements.getAlert().textContent).toContain("Heads up");
    });

    it("renders the description text", () => {
      expect(elements.getAlert().textContent).toContain("Something happened.");
    });
  });

  describe("given variant='info'", () => {
    beforeEach(() => {
      render(<Alert variant="info">Info message</Alert>);
    });

    it("exposes the info variant", () => {
      expect(elements.getAlert()).toHaveAttribute("data-variant", "info");
    });
  });

  describe("given variant='warning'", () => {
    beforeEach(() => {
      render(<Alert variant="warning">Warning message</Alert>);
    });

    it("exposes the warning variant", () => {
      expect(elements.getAlert()).toHaveAttribute("data-variant", "warning");
    });
  });

  describe("given variant='error'", () => {
    beforeEach(() => {
      render(<Alert variant="error">Error message</Alert>);
    });

    it("exposes the error variant", () => {
      expect(elements.getAlert()).toHaveAttribute("data-variant", "error");
    });
  });

  describe("given variant='success'", () => {
    beforeEach(() => {
      render(<Alert variant="success">Success message</Alert>);
    });

    it("exposes the success variant", () => {
      expect(elements.getAlert()).toHaveAttribute("data-variant", "success");
    });
  });

  describe("given children are provided", () => {
    beforeEach(() => {
      render(<Alert>Custom child content</Alert>);
    });

    it("renders the children inside the alert", () => {
      expect(elements.getAlert().textContent).toContain("Custom child content");
    });
  });
});
