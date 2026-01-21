import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { STATUS_SELECT_OPTIONS } from "@fixtures/enum-test-cases";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";

import { FormField } from "@/shared/components/ui/form";

import { StatusSelect } from "./status-select";

type TestFormData = {
  status: LibraryItemStatus;
};

const elements = {
  getTrigger: () => screen.getByRole("combobox"),
  getOptions: () => screen.getAllByRole("option"),
  getOptionByLabel: (label: string) =>
    screen.getByRole("option", { name: new RegExp(label, "i") }),
  getFormLabel: () => screen.getByText("Journey Status"),
  getFormDescription: () =>
    screen.getByText("Select your current journey status with this game"),
  getCustomDescription: (text: string) => screen.getByText(text),
  getOptionDescription: (description: string) =>
    screen.getAllByText(description)[0],
};

const actions = {
  clickTrigger: async () => {
    await userEvent.click(elements.getTrigger());
  },
  selectOption: async (label: string) => {
    await actions.clickTrigger();
    await userEvent.click(elements.getOptionByLabel(label));
  },
};

function renderStatusSelectInForm(props = {}) {
  const TestForm = () => {
    const methods = useForm<TestFormData>({
      defaultValues: {
        status: LibraryItemStatus.WANT_TO_PLAY,
      },
    });

    return (
      <FormProvider {...methods}>
        <form>
          <FormField
            control={methods.control}
            name="status"
            render={({ field }) => <StatusSelect field={field} {...props} />}
          />
        </form>
      </FormProvider>
    );
  };

  return render(<TestForm />);
}

describe("StatusSelect", () => {
  describe("given component just rendered", () => {
    it("should display form label and default description", () => {
      renderStatusSelectInForm();

      expect(elements.getFormLabel()).toBeVisible();
      expect(elements.getFormDescription()).toBeVisible();
      expect(elements.getTrigger()).toBeVisible();
    });

    it("should display custom description when provided", () => {
      const customDescription = "Update your journey status for this entry";
      renderStatusSelectInForm({ description: customDescription });

      expect(elements.getCustomDescription(customDescription)).toBeVisible();
    });
  });

  describe("given user opens the select dropdown", () => {
    it("should display all 4 status options", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      const options = elements.getOptions();
      expect(options).toHaveLength(4);
    });

    it.each(STATUS_SELECT_OPTIONS)(
      "should display '$label' option with description",
      async ({ label, description }) => {
        renderStatusSelectInForm();

        await actions.clickTrigger();

        expect(elements.getOptionByLabel(label)).toBeVisible();
        expect(elements.getOptionDescription(description)).toBeVisible();
      }
    );
  });
});
