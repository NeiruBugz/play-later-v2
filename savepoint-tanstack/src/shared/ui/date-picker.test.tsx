import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "./date-picker";

const onChange = vi.fn();

const elements = {
  getTrigger: () => screen.getByRole("button", { name: "Started" }),
  // Each day is a button inside its gridcell; the gridcell's accessible name is
  // its day-of-month text, which is unambiguous for mid-month days.
  getDayButton: (dayOfMonth: string) =>
    within(screen.getByRole("gridcell", { name: dayOfMonth })).getByRole(
      "button"
    ),
};

const actions = {
  openCalendar: () => userEvent.click(elements.getTrigger()),
  selectDay: (dayOfMonth: string) =>
    userEvent.click(elements.getDayButton(dayOfMonth)),
};

describe("DatePicker", () => {
  beforeEach(() => {
    onChange.mockReset();
  });

  describe("given a null value", () => {
    beforeEach(() => {
      render(
        <DatePicker
          ariaLabel="Started"
          value={null}
          onChange={onChange}
          placeholder="Pick a date"
        />
      );
    });

    it("renders the placeholder on the trigger", () => {
      expect(elements.getTrigger().textContent).toContain("Pick a date");
    });
  });

  describe("given a set value", () => {
    beforeEach(() => {
      render(
        <DatePicker
          ariaLabel="Started"
          value={new Date("2024-06-15T00:00:00Z")}
          onChange={onChange}
        />
      );
    });

    it("renders the formatted date on the trigger", () => {
      expect(elements.getTrigger().textContent).toContain("Jun 15, 2024");
    });
  });

  describe("given the calendar is opened and a day is selected", () => {
    beforeEach(async () => {
      render(
        <DatePicker ariaLabel="Started" value={null} onChange={onChange} />
      );
      await actions.openCalendar();
      // Day 15 is always mid-month, never an outside (adjacent-month) day, so
      // its gridcell is unambiguous regardless of which month is displayed.
      await actions.selectDay("15");
    });

    it("calls onChange with a Date", () => {
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]?.[0]).toBeInstanceOf(Date);
    });
  });
});
