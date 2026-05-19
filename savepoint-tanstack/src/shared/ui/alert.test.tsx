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

    it("applies the info class hook", () => {
      expect(elements.getAlert().className).toContain("info");
    });
  });

  describe("given variant='warning'", () => {
    beforeEach(() => {
      render(<Alert variant="warning">Warning message</Alert>);
    });

    it("applies the warning class hook", () => {
      expect(elements.getAlert().className).toContain("warning");
    });
  });

  describe("given variant='error'", () => {
    beforeEach(() => {
      render(<Alert variant="error">Error message</Alert>);
    });

    it("applies the error class hook", () => {
      expect(elements.getAlert().className).toContain("error");
    });
  });

  describe("given variant='success'", () => {
    beforeEach(() => {
      render(<Alert variant="success">Success message</Alert>);
    });

    it("applies the success class hook", () => {
      expect(elements.getAlert().className).toContain("success");
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
