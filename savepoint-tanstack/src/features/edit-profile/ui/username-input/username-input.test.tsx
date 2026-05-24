import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UsernameInput } from "./username-input";

// Mock the checkUsernameFn server fn — TanStack Start runtime not available in jsdom.
const mockCheckUsernameFn = vi.fn();
vi.mock("../../api/update-profile", () => ({
  checkUsernameFn: (...args: unknown[]) => mockCheckUsernameFn(...args),
}));

// Controlled wrapper so typing actually updates the value prop and re-renders.
function ControlledUsernameInput({
  initialValue = "",
  currentUsername,
}: {
  initialValue?: string;
  currentUsername?: string;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <UsernameInput
      value={value}
      onChange={setValue}
      currentUsername={currentUsername}
    />
  );
}

const elements = {
  getUsernameInput: () => screen.getByLabelText("Username"),
  queryAvailableIcon: () => screen.queryByLabelText("Username available"),
  queryErrorIcon: () => screen.queryByLabelText("Username error"),
  queryValidatingIcon: () => screen.queryByLabelText("Validating username"),
  queryAvailableMessage: () => screen.queryByRole("status"),
  queryErrorMessage: () => screen.queryByRole("alert"),
};

const actions = {
  typeValue: async (text: string) => {
    await userEvent.type(elements.getUsernameInput(), text);
  },
};

describe("UsernameInput", () => {
  beforeEach(() => {
    mockCheckUsernameFn.mockReset();
  });

  describe("given an idle state (empty value, no current username)", () => {
    beforeEach(() => {
      render(<ControlledUsernameInput initialValue="" />);
    });

    it("renders the username input field", () => {
      expect(elements.getUsernameInput()).toBeDefined();
    });

    it("shows no validation icon in idle state", () => {
      expect(elements.queryAvailableIcon()).toBeNull();
      expect(elements.queryErrorIcon()).toBeNull();
      expect(elements.queryValidatingIcon()).toBeNull();
    });

    it("shows no validation message in idle state", () => {
      expect(elements.queryAvailableMessage()).toBeNull();
      expect(elements.queryErrorMessage()).toBeNull();
    });
  });

  describe("given value matches currentUsername (no change scenario)", () => {
    beforeEach(() => {
      render(
        <UsernameInput
          value="alice"
          onChange={vi.fn()}
          currentUsername="alice"
        />
      );
    });

    it("stays in idle state — no validation triggered when value equals currentUsername", () => {
      expect(elements.queryAvailableIcon()).toBeNull();
      expect(elements.queryErrorIcon()).toBeNull();
      expect(elements.queryValidatingIcon()).toBeNull();
    });
  });

  describe("given user types a new username and the API responds available", () => {
    beforeEach(async () => {
      mockCheckUsernameFn.mockResolvedValue({ available: true });

      render(
        <ControlledUsernameInput initialValue="" currentUsername="oldhandle" />
      );

      await actions.typeValue("newhandle");

      // Advance past the USERNAME_VALIDATION_DEBOUNCE_MS (500ms) inside act
      // to flush the timer and resulting state updates.
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      // Flush the resolved API promise.
      await act(async () => {});
    });

    it("shows the Available icon", () => {
      expect(elements.queryAvailableIcon()).not.toBeNull();
    });

    it("shows the 'Username available' status message", () => {
      expect(elements.queryAvailableMessage()?.textContent).toBe(
        "Username available"
      );
    });
  });

  describe("given user types a new username and the API responds unavailable", () => {
    beforeEach(async () => {
      mockCheckUsernameFn.mockResolvedValue({ available: false });

      render(
        <ControlledUsernameInput initialValue="" currentUsername="oldhandle" />
      );

      await actions.typeValue("takenhandle");

      await act(async () => {
        vi.advanceTimersByTime(600);
      });
      await act(async () => {});
    });

    it("shows the Error icon", () => {
      expect(elements.queryErrorIcon()).not.toBeNull();
    });

    it("shows the 'Username already exists' error message", () => {
      expect(elements.queryErrorMessage()?.textContent).toBe(
        "Username already exists"
      );
    });

    it("marks the input as invalid", () => {
      expect(elements.getUsernameInput()).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });
  });

  describe("given user is typing (validating state while API is in-flight)", () => {
    beforeEach(async () => {
      // Never-resolving — component stays in validating state.
      mockCheckUsernameFn.mockReturnValue(new Promise(() => {}));

      render(<ControlledUsernameInput initialValue="" currentUsername="old" />);

      await actions.typeValue("typing");

      // Advance past the debounce to fire the API call.
      await act(async () => {
        vi.advanceTimersByTime(600);
      });
    });

    it("shows the spinner while the API call is in-flight", () => {
      expect(elements.queryValidatingIcon()).not.toBeNull();
    });
  });
});
