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
  getTablist: () => screen.getByRole("tablist"),
  // eslint-disable-next-line testing-library/no-node-access
  getRoot: () => screen.getByRole("tablist").parentElement,
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

  describe("given an inactive panel", () => {
    beforeEach(() => {
      render(
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
          <TabsContent value="journal" keepMounted>
            Journal panel
          </TabsContent>
          <TabsContent value="notes">Notes panel</TabsContent>
        </Tabs>
      );
    });

    it("keeps the keepMounted panel in the document but not visible", () => {
      const journalTabId = elements.getTab("Journal").id;
      const panel = screen
        .getAllByRole("tabpanel", { hidden: true })
        .find((p) => p.getAttribute("aria-labelledby") === journalTabId);
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveTextContent("Journal panel");
      expect(panel).not.toBeVisible();
    });

    it("unmounts the panel that has no keepMounted", () => {
      expect(screen.queryByText("Notes panel")).toBeNull();
    });
  });

  // jsdom computes no layout, so the layout classes are asserted against the
  // orientation attribute Base UI emits; real layout is verified in the browser.
  describe("given the default horizontal orientation", () => {
    beforeEach(() => {
      render(<UncontrolledHarness />);
    });

    it("emits data-orientation=horizontal on the tabs root", () => {
      expect(elements.getRoot()).toHaveAttribute(
        "data-orientation",
        "horizontal"
      );
    });

    it("emits data-orientation=horizontal on the tablist", () => {
      expect(elements.getTablist()).toHaveAttribute(
        "data-orientation",
        "horizontal"
      );
    });

    it("stacks the tablist above the panels via the emitted attribute", () => {
      expect(elements.getRoot()).toHaveClass(
        "data-[orientation=horizontal]:flex-col"
      );
    });

    it("sizes the tablist for a row via the emitted attribute", () => {
      expect(elements.getTablist()).toHaveClass(
        "group-data-[orientation=horizontal]/tabs:h-9"
      );
    });
  });

  describe("given vertical orientation", () => {
    beforeEach(() => {
      render(
        <Tabs defaultValue="overview" orientation="vertical">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
        </Tabs>
      );
    });

    it("emits data-orientation=vertical on the tablist", () => {
      expect(elements.getTablist()).toHaveAttribute(
        "data-orientation",
        "vertical"
      );
    });

    it("lays the tablist out as a column via the emitted attribute", () => {
      expect(elements.getTablist()).toHaveClass(
        "group-data-[orientation=vertical]/tabs:flex-col"
      );
    });
  });
});
