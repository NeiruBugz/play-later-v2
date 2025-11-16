import type { Platform } from "@prisma/client";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";

import { FormField } from "@/shared/components/ui/form";

import { PlatformCombobox } from "./platform-combobox";

type TestFormData = {
  platform: string;
};

// Mock platform data
const mockSupportedPlatforms: Platform[] = [
  {
    id: "plat1",
    igdbId: 167,
    name: "PlayStation 5",
    slug: "ps5",
    abbreviation: "PS5",
    alternativeName: null,
    generation: 9,
    platformFamily: null,
    platformType: null,
    checksum: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "plat2",
    igdbId: 169,
    name: "Xbox Series X|S",
    slug: "xbox-series-xs",
    abbreviation: "Series X|S",
    alternativeName: null,
    generation: 9,
    platformFamily: null,
    platformType: null,
    checksum: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockOtherPlatforms: Platform[] = [
  {
    id: "plat3",
    igdbId: 6,
    name: "PC (Microsoft Windows)",
    slug: "win",
    abbreviation: "PC",
    alternativeName: "Windows",
    generation: null,
    platformFamily: null,
    platformType: null,
    checksum: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "plat4",
    igdbId: 48,
    name: "PlayStation 4",
    slug: "ps4",
    abbreviation: "PS4",
    alternativeName: null,
    generation: 8,
    platformFamily: null,
    platformType: null,
    checksum: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const elements = {
  getTrigger: () => screen.getByRole("combobox"),
  getAllComboboxes: () => screen.getAllByRole("combobox"),
  getFormLabel: () => screen.getByText("Platform *"),
  getFormDescription: () =>
    screen.getByText("Select the platform you own this game on"),
  getCustomDescription: (text: string) => screen.getByText(text),
  getSearchInput: () => screen.getByPlaceholderText("Search platforms..."),
  querySearchInput: () => screen.queryByPlaceholderText("Search platforms..."),
  getSupportedGroup: () =>
    screen.getByRole("group", { name: /supported platforms/i }),
  getOtherGroup: () => screen.getByRole("group", { name: /other platforms/i }),
  querySupportedGroup: () =>
    screen.queryByRole("group", { name: /supported platforms/i }),
  queryOtherGroup: () =>
    screen.queryByRole("group", { name: /other platforms/i }),
  getAllGroups: () => screen.getAllByRole("group"),
  getEmptyMessage: () => screen.getByText("No platform found."),
  queryEmptyMessage: () => screen.queryByText("No platform found."),
  getOptionByName: (name: string) => screen.getByRole("option", { name }),
  getAllOptions: () => screen.getAllByRole("option"),
  getSeparator: () => screen.getByRole("separator"),
  querySeparator: () => screen.queryByRole("separator"),
};

const actions = {
  clickTrigger: async () => {
    await userEvent.click(elements.getTrigger());
  },
  selectPlatform: async (platformName: string) => {
    await actions.clickTrigger();
    const option = elements.getOptionByName(platformName);
    await userEvent.click(option);
  },
  searchPlatform: async (searchTerm: string) => {
    await actions.clickTrigger();
    const searchInput = elements.getSearchInput();
    await userEvent.type(searchInput, searchTerm);
  },
};

// Helper to wrap PlatformCombobox in a Form
function renderPlatformComboboxInForm(
  props: {
    supportedPlatforms?: Platform[];
    otherPlatforms?: Platform[];
    isLoading?: boolean;
    description?: string;
    defaultValue?: string;
  } = {}
) {
  const {
    supportedPlatforms = [],
    otherPlatforms = [],
    isLoading = false,
    description,
    defaultValue = "",
  } = props;

  const TestForm = () => {
    const methods = useForm<TestFormData>({
      defaultValues: {
        platform: defaultValue,
      },
    });

    return (
      <FormProvider {...methods}>
        <form>
          <FormField
            control={methods.control}
            name="platform"
            render={({ field }) => (
              <PlatformCombobox
                field={field}
                supportedPlatforms={supportedPlatforms}
                otherPlatforms={otherPlatforms}
                isLoading={isLoading}
                description={description}
              />
            )}
          />
        </form>
      </FormProvider>
    );
  };

  return render(<TestForm />);
}

describe("PlatformCombobox", () => {
  describe("given component just rendered", () => {
    it("should display form label with required indicator", () => {
      renderPlatformComboboxInForm();

      expect(elements.getFormLabel()).toBeVisible();
    });

    it("should display default description", () => {
      renderPlatformComboboxInForm();

      expect(elements.getFormDescription()).toBeVisible();
    });

    it("should display custom description when provided", () => {
      const customDescription = "Choose your platform";
      renderPlatformComboboxInForm({ description: customDescription });

      expect(elements.getCustomDescription(customDescription)).toBeVisible();
    });

    it("should display combobox trigger button", () => {
      renderPlatformComboboxInForm();

      expect(elements.getTrigger()).toBeVisible();
      expect(elements.getTrigger()).toHaveAttribute("role", "combobox");
    });

    it("should display 'Select platform' placeholder when no platform selected", () => {
      renderPlatformComboboxInForm();

      expect(elements.getTrigger()).toHaveTextContent("Select platform");
    });

    it("should display selected platform name when value is set", () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        defaultValue: "PlayStation 5",
      });

      expect(elements.getTrigger()).toHaveTextContent("PlayStation 5");
    });
  });

  describe("given loading state", () => {
    it("should display 'Loading platforms...' when isLoading is true", () => {
      renderPlatformComboboxInForm({ isLoading: true });

      expect(elements.getTrigger()).toHaveTextContent("Loading platforms...");
    });

    it("should disable trigger button when loading", () => {
      renderPlatformComboboxInForm({ isLoading: true });

      expect(elements.getTrigger()).toBeDisabled();
    });

    it("should not open popover when trigger clicked while loading", async () => {
      renderPlatformComboboxInForm({ isLoading: true });

      await userEvent.click(elements.getTrigger());

      expect(elements.querySearchInput()).not.toBeInTheDocument();
    });
  });

  describe("given user opens the combobox", () => {
    it("should display search input", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSearchInput()).toBeVisible();
    });

    it("should expand combobox aria attribute", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      const trigger = elements.getTrigger();
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(trigger);

      // After clicking, the trigger button should have aria-expanded="true"
      // Note: There are now two elements with role="combobox" (button and search input)
      const buttons = elements.getAllComboboxes();
      const triggerButton = buttons.find((el) => el.tagName === "BUTTON");
      expect(triggerButton).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("given supported platforms only", () => {
    it("should display 'Supported Platforms' group", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSupportedGroup()).toBeVisible();
    });

    it("should display all supported platform options", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSupportedGroup()).toBeVisible();
      expect(elements.getOptionByName("PlayStation 5")).toBeVisible();
      expect(elements.getOptionByName("Xbox Series X|S")).toBeVisible();
    });

    it("should not display 'Other Platforms' group", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.queryOtherGroup()).not.toBeInTheDocument();
    });

    it("should not display separator", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      const separator = elements.querySeparator();
      expect(separator).not.toBeInTheDocument();
    });
  });

  describe("given other platforms only", () => {
    it("should display 'Other Platforms' group", async () => {
      renderPlatformComboboxInForm({
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getOtherGroup()).toBeVisible();
    });

    it("should display all other platform options", async () => {
      renderPlatformComboboxInForm({
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getOtherGroup()).toBeVisible();
      expect(elements.getOptionByName("PC (Microsoft Windows)")).toBeVisible();
      expect(elements.getOptionByName("PlayStation 4")).toBeVisible();
    });

    it("should not display 'Supported Platforms' group", async () => {
      renderPlatformComboboxInForm({
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.querySupportedGroup()).not.toBeInTheDocument();
    });

    it("should not display separator", async () => {
      renderPlatformComboboxInForm({
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      const separator = elements.querySeparator();
      expect(separator).not.toBeInTheDocument();
    });
  });

  describe("given both supported and other platforms", () => {
    it("should display both platform groups", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSupportedGroup()).toBeVisible();
      expect(elements.getOtherGroup()).toBeVisible();
    });

    it("should display separator between groups", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSeparator()).toBeVisible();
    });

    it("should display supported platforms before other platforms", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      const groups = elements.getAllGroups();
      expect(groups[0]).toHaveAccessibleName(/supported platforms/i);
      expect(groups[1]).toHaveAccessibleName(/other platforms/i);
    });

    it("should display all platform options across both groups", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      const allOptions = elements.getAllOptions();
      expect(allOptions).toHaveLength(4);
    });
  });

  describe("given no platforms", () => {
    it("should display empty state message", async () => {
      renderPlatformComboboxInForm();

      await actions.clickTrigger();

      expect(elements.getEmptyMessage()).toBeVisible();
    });

    it("should not display any platform groups", async () => {
      renderPlatformComboboxInForm();

      await actions.clickTrigger();

      expect(elements.querySupportedGroup()).not.toBeInTheDocument();
      expect(elements.queryOtherGroup()).not.toBeInTheDocument();
    });
  });

  describe("given user selects a platform", () => {
    it("should update trigger text to selected platform name", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.selectPlatform("PlayStation 5");

      expect(elements.getTrigger()).toHaveTextContent("PlayStation 5");
    });

    it("should close the popover after selection", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.selectPlatform("PlayStation 5");

      expect(elements.querySearchInput()).not.toBeInTheDocument();
    });

    it("should mark selected platform when reopened", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.selectPlatform("PlayStation 5");
      await actions.clickTrigger();

      const selectedOption = elements.getOptionByName("PlayStation 5");

      // Verify the option is marked as selected via aria-selected or data-selected attributes
      expect(selectedOption).toHaveAttribute("aria-selected", "true");
    });

    it("should allow selecting from other platforms group", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.selectPlatform("PC (Microsoft Windows)");

      expect(elements.getTrigger()).toHaveTextContent("PC (Microsoft Windows)");
    });
  });

  describe("given user searches for platforms", () => {
    it("should filter platforms based on search term", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.searchPlatform("PlayStation");

      const options = elements.getAllOptions();
      expect(options).toHaveLength(2); // PlayStation 5 and PlayStation 4
    });

    it("should search case-insensitively", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.searchPlatform("playstation");

      expect(elements.getOptionByName("PlayStation 5")).toBeVisible();
    });

    it("should display empty message when no platforms match search", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.searchPlatform("Nintendo Switch");

      expect(elements.getEmptyMessage()).toBeVisible();
    });

    it("should search across both supported and other platforms", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.searchPlatform("Xbox");

      expect(elements.getOptionByName("Xbox Series X|S")).toBeVisible();
    });
  });

  describe("accessibility", () => {
    it("should have correct ARIA attributes on trigger", () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      const trigger = elements.getTrigger();
      expect(trigger).toHaveAttribute("role", "combobox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("should have accessible name for search input", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await actions.clickTrigger();

      const searchInput = elements.getSearchInput();
      expect(searchInput).toHaveAttribute("placeholder", "Search platforms...");
    });

    it("should have accessible group labels", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      expect(elements.getSupportedGroup()).toHaveAccessibleName(
        /supported platforms/i
      );
      expect(elements.getOtherGroup()).toHaveAccessibleName(/other platforms/i);
    });

    it("should have role='option' on all platform items", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
        otherPlatforms: mockOtherPlatforms,
      });

      await actions.clickTrigger();

      const options = elements.getAllOptions();
      expect(options.length).toBeGreaterThan(0);
      options.forEach((option) => {
        expect(option).toHaveAttribute("role", "option");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("should open popover when trigger receives Enter key", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      elements.getTrigger().focus();
      await userEvent.keyboard("{Enter}");

      expect(elements.getSearchInput()).toBeVisible();
    });

    it("should open popover when trigger receives Space key", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      elements.getTrigger().focus();
      await userEvent.keyboard(" ");

      expect(elements.getSearchInput()).toBeVisible();
    });

    it("should allow Tab navigation to move through form", async () => {
      renderPlatformComboboxInForm({
        supportedPlatforms: mockSupportedPlatforms,
      });

      await userEvent.tab();

      expect(elements.getTrigger()).toHaveFocus();
    });
  });
});
