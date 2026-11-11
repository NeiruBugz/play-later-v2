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
  setEveningLengthFn: async (input: {
    data?: { eveningMinutes: number };
    eveningMinutes?: number;
  }) => {
    evening.state.saved =
      input.data?.eveningMinutes ?? input.eveningMinutes ?? 105;
  },
}));

vi.mock("@/features/set-evening-length/api/set-evening-length", () => ({
  setEveningLengthFn: async (input: {
    data?: { eveningMinutes: number };
    eveningMinutes?: number;
  }) => {
    evening.state.saved =
      input.data?.eveningMinutes ?? input.eveningMinutes ?? 105;
  },
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

const elements = {
  getHeading: () =>
    screen.getByRole("heading", { name: "How long is an evening for you?" }),
  getRadio: (name: string) => screen.getByRole("radio", { name }),
  getAllRadios: () => screen.getAllByRole("radio"),
  getExampleLine: (text: string) => screen.findByText(text),
};

const actions = {
  chooseLength: async (name: string) =>
    userEvent.click(elements.getRadio(name)),
};

describe("settings/play route", () => {
  describe("given a user who never changed the setting", () => {
    beforeEach(() => {
      evening.state.saved = 105;
      evening.state.shown = 105;
      const SettingsPlayPage = Route.options.component as ComponentType;
      render(
        <QueryClientProvider client={new QueryClient()}>
          <SettingsPlayPage />
        </QueryClientProvider>
      );
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
  });
});
