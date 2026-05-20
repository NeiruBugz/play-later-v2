import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Toggle section" }),
  queryContent: () => screen.queryByText("Hidden content"),
};

const actions = {
  clickTrigger: async () => userEvent.click(elements.getTrigger()),
  pressTriggerEnter: async () => {
    elements.getTrigger().focus();
    await userEvent.keyboard("{Enter}");
  },
  pressTriggerSpace: async () => {
    elements.getTrigger().focus();
    await userEvent.keyboard(" ");
  },
};

function UncontrolledHarness({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>Toggle section</CollapsibleTrigger>
      <CollapsibleContent>Hidden content</CollapsibleContent>
    </Collapsible>
  );
}

function ControlledHarness({ open }: { open: boolean }) {
  const [isOpen, setIsOpen] = React.useState(open);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>Toggle section</CollapsibleTrigger>
      <CollapsibleContent>Hidden content</CollapsibleContent>
    </Collapsible>
  );
}

describe("Collapsible", () => {
  describe("given uncontrolled mode with defaultOpen=false", () => {
    beforeEach(() => {
      render(<UncontrolledHarness />);
    });

    it("hides the content initially", () => {
      expect(elements.queryContent()).toBeNull();
    });

    it("sets aria-expanded='false' on the trigger", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("reveals the content after a click", async () => {
      await actions.clickTrigger();
      expect(elements.queryContent()).not.toBeNull();
    });

    it("sets aria-expanded='true' after opening", async () => {
      await actions.clickTrigger();
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("collapses the content on a second click", async () => {
      await actions.clickTrigger();
      await actions.clickTrigger();
      expect(elements.queryContent()).toBeNull();
    });
  });

  describe("given uncontrolled mode with defaultOpen=true", () => {
    beforeEach(() => {
      render(<UncontrolledHarness defaultOpen />);
    });

    it("renders the content on initial mount", () => {
      expect(elements.queryContent()).not.toBeNull();
    });

    it("sets aria-expanded='true' on the trigger initially", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("given controlled mode with open=false", () => {
    beforeEach(() => {
      render(<ControlledHarness open={false} />);
    });

    it("hides the content when open prop is false", () => {
      expect(elements.queryContent()).toBeNull();
    });

    it("sets aria-expanded='false' on the trigger", () => {
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("toggles open when trigger is clicked", async () => {
      await actions.clickTrigger();
      expect(elements.queryContent()).not.toBeNull();
    });
  });

  describe("given keyboard interaction", () => {
    beforeEach(() => {
      render(<UncontrolledHarness />);
    });

    it("opens the collapsible when Enter is pressed on the trigger", async () => {
      await actions.pressTriggerEnter();
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("opens the collapsible when Space is pressed on the trigger", async () => {
      await actions.pressTriggerSpace();
      expect(elements.getTrigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
