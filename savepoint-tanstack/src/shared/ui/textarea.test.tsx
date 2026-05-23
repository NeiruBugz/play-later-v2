import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Textarea } from "./textarea";

const elements = {
  getTextarea: () => screen.getByRole("textbox"),
};

const actions = {
  typeText: async (text: string) =>
    userEvent.type(elements.getTextarea(), text),
};

describe("Textarea", () => {
  describe("given controlled mode", () => {
    const onChange = vi.fn();

    beforeEach(() => {
      onChange.mockClear();
      render(<Textarea value="hello" onChange={onChange} />);
    });

    it("renders the controlled value", () => {
      expect(elements.getTextarea()).toHaveValue("hello");
    });

    it("calls onChange when the user types", async () => {
      await actions.typeText("x");
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("given uncontrolled mode with a defaultValue", () => {
    beforeEach(() => {
      render(<Textarea defaultValue="seed" />);
    });

    it("renders the defaultValue", () => {
      expect(elements.getTextarea()).toHaveValue("seed");
    });

    it("updates the value as the user types", async () => {
      await actions.typeText("!");
      expect(elements.getTextarea()).toHaveValue("seed!");
    });
  });

  describe("given a forwarded ref", () => {
    it("attaches the ref to the underlying textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} defaultValue="ref-test" />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref.current?.value).toBe("ref-test");
    });
  });

  describe("given the disabled prop", () => {
    beforeEach(() => {
      render(<Textarea disabled defaultValue="locked" />);
    });

    it("ignores user typing", async () => {
      await actions.typeText("nope");
      expect(elements.getTextarea()).toHaveValue("locked");
    });
  });
});
