import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSyncExternalStore, type ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./_authed/settings/play";

const evening = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { saved: 105, shown: 105 };
  return {
    state,
    saveSpy: vi.fn(),
    setEveningLengthFn: async (input: {
      data?: { eveningMinutes: number };
      eveningMinutes?: number;
    }) => {
      evening.saveSpy(input);
      state.saved = input.data?.eveningMinutes ?? input.eveningMinutes ?? 105;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getShown: () => state.shown,
    refreshFromServer: () => {
      state.shown = state.saved;
      listeners.forEach((listener) => listener());
    },
  };
});

vi.mock("@/features/set-evening-length", () => ({
  setEveningLengthFn: evening.setEveningLengthFn,
}));

vi.mock("@/features/set-evening-length/api/set-evening-length", () => ({
  setEveningLengthFn: evening.setEveningLengthFn,
}));

vi.mock("@/shared/lib/auth/auth.server", () => ({ auth: {} }));

vi.mock("@/entities/session", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useEveningMinutes: () =>
    useSyncExternalStore(evening.subscribe, evening.getShown),
  invalidateCurrentUser: async () => evening.refreshFromServer(),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({ options: opts }),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const RANGE_ERROR = "Enter a length between 30 minutes and 6 hours.";

const elements = {
  getHeading: () =>
    screen.getByRole("heading", { name: "How long is an evening for you?" }),
  getRadio: (name: string) => screen.getByRole("radio", { name }),
  getAllRadios: () => screen.getAllByRole("radio"),
  getSelectedRadios: () =>
    screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("aria-checked") === "true"),
  getExampleLine: (text: string) => screen.findByText(text),
  getCustomLength: () => screen.getByLabelText("Custom length"),
  getUnit: () => screen.getByLabelText("Unit"),
  queryError: () => screen.queryByRole("alert"),
};

const savedMinutes = () =>
  evening.saveSpy.mock.calls.map(
    ([input]) => (input.data ?? input).eveningMinutes
  );

const actions = {
  chooseLength: async (name: string) =>
    userEvent.click(elements.getRadio(name)),
  typeCustomLength: async (
    text: string,
    unit: "minutes" | "hours" = "minutes"
  ) => {
    if (unit === "hours") {
      await userEvent.selectOptions(elements.getUnit(), "hours");
    }
    const field = elements.getCustomLength();
    await userEvent.clear(field);
    if (text !== "") {
      await userEvent.type(field, text);
    }
  },
  commitWithEnter: async () => userEvent.keyboard("{Enter}"),
  commitWithBlur: async () => userEvent.tab(),
};

const renderPage = (stored: number) => {
  evening.state.saved = stored;
  evening.state.shown = stored;
  evening.saveSpy.mockClear();
  const SettingsPlayPage = Route.options.component as ComponentType;
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SettingsPlayPage />
    </QueryClientProvider>
  );
};

describe("settings/play route", () => {
  describe("given a user who never changed the setting", () => {
    beforeEach(() => {
      renderPage(105);
    });

    it("asks how long an evening is for them", () => {
      expect(elements.getHeading()).toBeDefined();
    });

    it("offers the six lengths", () => {
      expect(elements.getAllRadios()).toHaveLength(6);
      ["1 h", "1.5 h", "1.75 h", "2 h", "2.5 h", "3 h"].forEach((name) => {
        expect(elements.getRadio(name)).toBeDefined();
      });
    });

    it("shows 1.75 h selected", () => {
      expect(elements.getRadio("1.75 h")).toHaveAttribute(
        "aria-checked",
        "true"
      );
      expect(elements.getRadio("3 h")).toHaveAttribute("aria-checked", "false");
    });

    it("leaves the custom length empty, in minutes", () => {
      expect(elements.getCustomLength()).toHaveValue(null);
      expect(elements.getUnit()).toHaveValue("minutes");
    });

    it("explains the choice with a 14.5-hour example", async () => {
      expect(
        await elements.getExampleLine("A 14.5-hour game is about 8 evenings.")
      ).toBeDefined();
    });

    describe("when they choose 3 h", () => {
      beforeEach(async () => {
        await actions.chooseLength("3 h");
      });

      it("selects 3 h", async () => {
        await screen.findByText("A 14.5-hour game is about 5 evenings.");
        expect(elements.getRadio("3 h")).toHaveAttribute(
          "aria-checked",
          "true"
        );
      });

      it("updates the example line to the 3-hour result", async () => {
        expect(
          await elements.getExampleLine("A 14.5-hour game is about 5 evenings.")
        ).toBeDefined();
      });
    });

    describe("when they type 150 minutes and press Enter", () => {
      beforeEach(async () => {
        await actions.typeCustomLength("150");
        await actions.commitWithEnter();
      });

      it("saves 150 and selects the 2.5 h pill", async () => {
        await screen.findByText("A 14.5-hour game is about 6 evenings.");
        expect(savedMinutes()).toEqual([150]);
        expect(elements.getRadio("2.5 h")).toHaveAttribute(
          "aria-checked",
          "true"
        );
      });
    });

    describe("when they type 135 minutes and leave the field", () => {
      beforeEach(async () => {
        await actions.typeCustomLength("135");
        await actions.commitWithBlur();
      });

      it("saves 135, selects no pill and keeps 135 minutes in the field", async () => {
        await screen.findByText("A 14.5-hour game is about 6 evenings.");
        expect(savedMinutes()).toEqual([135]);
        expect(elements.getSelectedRadios()).toHaveLength(0);
        expect(elements.getCustomLength()).toHaveValue(135);
        expect(elements.getUnit()).toHaveValue("minutes");
      });
    });

    describe("when they type 2.25 hours and press Enter", () => {
      beforeEach(async () => {
        await actions.typeCustomLength("2.25", "hours");
        await actions.commitWithEnter();
      });

      it("saves 135 minutes", async () => {
        await screen.findByText("A 14.5-hour game is about 6 evenings.");
        expect(savedMinutes()).toEqual([135]);
      });
    });

    describe.each([
      ["20 minutes", "20", "minutes"],
      ["7 hours", "7", "hours"],
      ["0 minutes", "0", "minutes"],
      ["-90 minutes", "-90", "minutes"],
      ["nothing", "", "minutes"],
      ["letters", "abc", "minutes"],
    ] as const)("when they commit %s", (_label, text, unit) => {
      beforeEach(async () => {
        await actions.typeCustomLength(text, unit);
        await actions.commitWithEnter();
      });

      it("shows the range error and does not save", () => {
        expect(elements.queryError()).toHaveTextContent(RANGE_ERROR);
        expect(evening.saveSpy).not.toHaveBeenCalled();
      });
    });

    describe("when they save a custom length and then choose a pill", () => {
      beforeEach(async () => {
        await actions.typeCustomLength("135");
        await actions.commitWithBlur();
        evening.saveSpy.mockClear();
        await actions.chooseLength("1 h");
      });

      it("saves the pill and clears the custom field", async () => {
        await screen.findByText("A 14.5-hour game is about 15 evenings.");
        expect(savedMinutes()).toEqual([60]);
        expect(elements.getCustomLength()).toHaveValue(null);
        expect(elements.getRadio("1 h")).toHaveAttribute(
          "aria-checked",
          "true"
        );
      });
    });
  });

  describe("given a stored evening of 135 minutes, which is no pill", () => {
    beforeEach(() => {
      renderPage(135);
    });

    it("selects no pill and shows 135 in minutes", () => {
      expect(elements.getSelectedRadios()).toHaveLength(0);
      expect(elements.getCustomLength()).toHaveValue(135);
      expect(elements.getUnit()).toHaveValue("minutes");
    });

    it("explains the choice with the custom length", async () => {
      expect(
        await elements.getExampleLine("A 14.5-hour game is about 6 evenings.")
      ).toBeDefined();
    });
  });

  describe("given a stored evening of 240 minutes, a whole number of hours", () => {
    beforeEach(() => {
      renderPage(240);
    });

    it("shows 4 in hours", () => {
      expect(elements.getCustomLength()).toHaveValue(4);
      expect(elements.getUnit()).toHaveValue("hours");
    });
  });

  describe("given a stored evening of 150 minutes, which is a pill", () => {
    beforeEach(() => {
      renderPage(150);
    });

    it("selects the 2.5 h pill and leaves the custom field empty", () => {
      expect(elements.getRadio("2.5 h")).toHaveAttribute(
        "aria-checked",
        "true"
      );
      expect(elements.getCustomLength()).toHaveValue(null);
    });
  });
});
