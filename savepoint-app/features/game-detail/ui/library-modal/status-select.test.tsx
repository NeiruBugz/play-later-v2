import { LibraryItemStatus } from "@prisma/client";
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
  getFormDescription: () =>
    screen.getByText("Select your current journey status with this game"),
  getCustomDescription: (text: string) => screen.getByText(text),
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

// Helper to wrap StatusSelect in a Form
function renderStatusSelectInForm(props = {}) {
  const TestForm = () => {
    const methods = useForm<TestFormData>({
      defaultValues: {
        status: LibraryItemStatus.CURIOUS_ABOUT,
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
    it("should display form label", () => {
      renderStatusSelectInForm();

      expect(screen.getByText("Journey Status")).toBeVisible();
    });

    it("should display default description", () => {
      renderStatusSelectInForm();

      expect(elements.getFormDescription()).toBeInTheDocument();
    });

    it("should display custom description when provided", () => {
      const customDescription = "Update your journey status for this entry";
      renderStatusSelectInForm({ description: customDescription });

      expect(
        elements.getCustomDescription(customDescription)
      ).toBeInTheDocument();
    });

    it("should display select trigger", () => {
      renderStatusSelectInForm();

      expect(elements.getTrigger()).toBeInTheDocument();
    });
  });

  describe("given user opens the select dropdown", () => {
    it("should display all 6 status options", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      const options = elements.getOptions();
      expect(options).toHaveLength(6);
    });

    it("should display 'Curious About' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(elements.getOptionByLabel("Curious About")).toBeInTheDocument();
      expect(
        screen.getAllByText("Interested in trying this game")[0]
      ).toBeVisible();
    });

    it("should display 'Currently Exploring' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(
        elements.getOptionByLabel("Currently Exploring")
      ).toBeInTheDocument();
      expect(
        screen.getAllByText("Actively playing this game")[0]
      ).toBeVisible();
    });

    it("should display 'Took a Break' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(elements.getOptionByLabel("Took a Break")).toBeInTheDocument();
      expect(screen.getAllByText("Paused but plan to return")[0]).toBeVisible();
    });

    it("should display 'Experienced' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(elements.getOptionByLabel("Experienced")).toBeInTheDocument();
      expect(
        screen.getAllByText("Finished or thoroughly explored")[0]
      ).toBeVisible();
    });

    it("should display 'Wishlist' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(elements.getOptionByLabel("Wishlist")).toBeInTheDocument();
      expect(
        screen.getAllByText("Want to play in the future")[0]
      ).toBeVisible();
    });

    it("should display 'Revisiting' option with description", async () => {
      renderStatusSelectInForm();

      await actions.clickTrigger();

      expect(elements.getOptionByLabel("Revisiting")).toBeInTheDocument();
      expect(
        screen.getAllByText("Playing again after completing")[0]
      ).toBeVisible();
    });
  });

  describe("given custom className provided", () => {
    it("should apply className to SelectTrigger", () => {
      renderStatusSelectInForm({
        className: "py-6 text-left",
      });

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveClass("py-6");
      expect(trigger).toHaveClass("text-left");
    });
  });
});
