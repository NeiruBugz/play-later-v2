import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const elements = {
  getTab: (name: string) => screen.getByRole("tab", { name }),
  queryPanel: (name: string) =>
    screen.queryByRole("tabpanel", { name, hidden: true }),
  getPanel: (name: string) =>
    screen.getByRole("tabpanel", { name, hidden: true }),
};

const actions = {
  clickTab: async (name: string) => userEvent.click(elements.getTab(name)),
};

const onValueChange = vi.fn();

function ControlledHarness() {
  const [value, setValue] = React.useState("overview");
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange(v);
      }}
    >
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="journal">Journal</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="journal">Journal panel</TabsContent>
    </Tabs>
  );
}

function UncontrolledHarness() {
  return (
    <Tabs defaultValue="journal">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="journal">Journal</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="journal">Journal panel</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  beforeEach(() => {
    onValueChange.mockReset();
  });

  describe("given controlled mode with initial value 'overview'", () => {
    beforeEach(() => {
      render(<ControlledHarness />);
    });

    it("marks the overview tab as selected", () => {
      expect(elements.getTab("Overview")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("renders the overview panel content", () => {
      expect(elements.getPanel("Overview").textContent).toContain(
        "Overview panel"
      );
    });

    it("hides the journal panel", () => {
      expect(elements.queryPanel("Journal")).toBeNull();
    });

    it("invokes onValueChange when a different tab is clicked", async () => {
      await actions.clickTab("Journal");
      expect(onValueChange).toHaveBeenCalledWith("journal");
    });

    it("swaps the visible panel after a tab change", async () => {
      await actions.clickTab("Journal");
      expect(elements.getPanel("Journal").textContent).toContain(
        "Journal panel"
      );
    });
  });

  describe("given uncontrolled mode with defaultValue 'journal'", () => {
    beforeEach(() => {
      render(<UncontrolledHarness />);
    });

    it("marks the journal tab as selected", () => {
      expect(elements.getTab("Journal")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });

    it("renders the journal panel content", () => {
      expect(elements.getPanel("Journal").textContent).toContain(
        "Journal panel"
      );
    });

    it("activates the overview tab when clicked without a controller", async () => {
      await actions.clickTab("Overview");
      expect(elements.getTab("Overview")).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });
});
