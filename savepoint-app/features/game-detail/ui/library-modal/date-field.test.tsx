import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";

import { FormField } from "@/shared/components/ui/form";

import { DateField } from "./date-field";

type TestFormData = {
  startedAt?: Date;
};

const elements = {
  getDateInput: () => screen.getByLabelText(/started at/i),
  getLabel: () => screen.getByText(/started at/i),
  getDescription: () => screen.queryByText(/when did you start playing/i),
  getErrorMessage: () => screen.queryByRole("alert"),
  queryErrorMessage: () => screen.queryByRole("alert"),
};

const actions = {
  typeDate: async (dateString: string) => {
    const input = elements.getDateInput() as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, dateString);
  },
  clearDate: async () => {
    const input = elements.getDateInput() as HTMLInputElement;
    await userEvent.click(input);
    await userEvent.clear(input);
    input.blur();
  },
  changeDate: async (dateString: string) => {
    const input = elements.getDateInput() as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, dateString);
  },
};

function renderDateFieldInForm(
  props: {
    defaultValue?: Date;
    withDescription?: boolean;
    onSubmit?: (data: TestFormData) => void;
  } = {}
) {
  const TestForm = () => {
    const methods = useForm<TestFormData>({
      defaultValues: {
        startedAt: props.defaultValue,
      },
    });

    const handleSubmit = (data: TestFormData) => {
      if (props.onSubmit) {
        props.onSubmit(data);
      }
    };

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <FormField
            control={methods.control}
            name="startedAt"
            render={({ field }) => (
              <DateField
                field={field}
                label="Started At (Optional)"
                description={
                  props.withDescription
                    ? "When did you start playing?"
                    : undefined
                }
              />
            )}
          />
          <button type="submit">Submit</button>
        </form>
      </FormProvider>
    );
  };

  return render(<TestForm />);
}

describe("DateField", () => {
  describe("given component just rendered", () => {
    it("should display label text", () => {
      renderDateFieldInForm();

      expect(elements.getLabel()).toBeVisible();
      expect(elements.getLabel()).toHaveTextContent("Started At (Optional)");
    });

    it("should display date input element", () => {
      renderDateFieldInForm();

      const input = elements.getDateInput();
      expect(input).toBeVisible();
      expect(input).toHaveAttribute("type", "date");
    });

    it("should display description when provided", () => {
      renderDateFieldInForm({ withDescription: true });

      expect(elements.getDescription()).toBeVisible();
    });

    it("should not display description when not provided", () => {
      renderDateFieldInForm({ withDescription: false });

      expect(elements.getDescription()).not.toBeInTheDocument();
    });

    it("should render with empty value when no default value provided", () => {
      renderDateFieldInForm();

      const input = elements.getDateInput();
      expect(input).toHaveValue("");
    });

    it("should render with formatted date value when default provided", () => {
      const testDate = new Date("2025-01-15");
      renderDateFieldInForm({ defaultValue: testDate });

      const input = elements.getDateInput();
      expect(input).toHaveValue("2025-01-15");
    });
  });

  describe("given user interacts with date input", () => {
    it("should allow user to select a date", async () => {
      renderDateFieldInForm();

      await actions.typeDate("2025-01-20");

      await waitFor(() => {
        const input = elements.getDateInput();
        expect(input).toHaveValue("2025-01-20");
      });
    });
  });

  describe("given date conversion and formatting", () => {
    it("should convert Date object to yyyy-MM-dd string for input value", () => {
      const testDate = new Date("2025-03-25");
      renderDateFieldInForm({ defaultValue: testDate });

      const input = elements.getDateInput();
      expect(input).toHaveValue("2025-03-25");
    });

    it("should handle dates from different months correctly", () => {
      const testDate = new Date("2025-12-01");
      renderDateFieldInForm({ defaultValue: testDate });

      const input = elements.getDateInput();
      expect(input).toHaveValue("2025-12-01");
    });

    it("should handle single-digit days with zero padding", () => {
      const testDate = new Date("2025-05-05");
      renderDateFieldInForm({ defaultValue: testDate });

      const input = elements.getDateInput();
      expect(input).toHaveValue("2025-05-05");
    });
  });

  describe("given form submission with date values", () => {
    it("should submit Date object when date is selected", async () => {
      const onSubmit = vi.fn();
      renderDateFieldInForm({ onSubmit });

      await actions.typeDate("2025-01-20");
      await userEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            startedAt: expect.any(Date),
          })
        );
      });

      const submittedData = onSubmit.mock.calls[0][0];
      const submittedDate = submittedData.startedAt as Date;
      expect(submittedDate.toISOString().split("T")[0]).toBe("2025-01-20");
    });

    it("should submit undefined when date is not provided", async () => {
      const onSubmit = vi.fn();
      renderDateFieldInForm({ onSubmit });

      await userEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          startedAt: undefined,
        });
      });
    });

    it("should submit undefined when date is cleared", async () => {
      const onSubmit = vi.fn();
      const testDate = new Date("2025-01-15");
      renderDateFieldInForm({ defaultValue: testDate, onSubmit });

      await actions.clearDate();
      await userEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          startedAt: undefined,
        });
      });
    });
  });

  describe("given null or undefined values", () => {
    it("should handle undefined value correctly", () => {
      renderDateFieldInForm({ defaultValue: undefined });

      const input = elements.getDateInput();
      expect(input).toHaveValue("");
    });

    it("should handle null value correctly", () => {
      renderDateFieldInForm({ defaultValue: null as unknown as Date });

      const input = elements.getDateInput();
      expect(input).toHaveValue("");
    });
  });
});
