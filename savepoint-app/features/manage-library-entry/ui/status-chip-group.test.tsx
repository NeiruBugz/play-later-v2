import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { STATUS_BADGE_TEST_CASES } from "@fixtures/enum-test-cases";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";

import { FormField } from "@/shared/components/ui/form";

import { StatusChipGroup } from "./status-chip-group";

type TestFormData = {
  status: LibraryItemStatus;
};

const elements = {
  getWantToPlayChip: () => screen.getByRole("radio", { name: /want to play/i }),
  getOwnedChip: () => screen.getByRole("radio", { name: /owned/i }),
  getPlayingChip: () => screen.getByRole("radio", { name: /playing/i }),
  getPlayedChip: () => screen.getByRole("radio", { name: /played/i }),
  getAllChips: () => screen.getAllByRole("radio"),
  getRadioGroup: () =>
    screen.getByRole("radiogroup", { name: /journey status/i }),
  getFormLabel: () => screen.getByText("Status"),
  getChipByLabel: (label: string) =>
    screen.getByRole("radio", { name: new RegExp(label, "i") }),
};

const actions = {
  selectWantToPlay: async () => {
    await userEvent.click(elements.getWantToPlayChip());
  },
  selectOwned: async () => {
    await userEvent.click(elements.getOwnedChip());
  },
  selectPlaying: async () => {
    await userEvent.click(elements.getPlayingChip());
  },
  selectPlayed: async () => {
    await userEvent.click(elements.getPlayedChip());
  },
};

function renderStatusChipGroupInForm(defaultStatus = LibraryItemStatus.PLAYED) {
  const TestForm = () => {
    const methods = useForm<TestFormData>({
      defaultValues: {
        status: defaultStatus,
      },
    });

    return (
      <FormProvider {...methods}>
        <form>
          <FormField
            control={methods.control}
            name="status"
            render={({ field }) => <StatusChipGroup field={field} />}
          />
        </form>
      </FormProvider>
    );
  };

  return render(<TestForm />);
}

describe("StatusChipGroup", () => {
  describe("given component just rendered", () => {
    it("should display form label and radio group", () => {
      renderStatusChipGroupInForm();

      expect(elements.getFormLabel()).toBeVisible();
      expect(elements.getRadioGroup()).toBeVisible();
    });

    it("should render exactly 4 status chips", () => {
      renderStatusChipGroupInForm();

      const chips = elements.getAllChips();
      expect(chips).toHaveLength(4);
    });

    it("should render chips in correct order: Want to Play, Owned, Playing, Played", () => {
      renderStatusChipGroupInForm();

      const chips = elements.getAllChips();
      expect(chips[0]).toHaveTextContent("Want to Play");
      expect(chips[1]).toHaveTextContent("Owned");
      expect(chips[2]).toHaveTextContent("Playing");
      expect(chips[3]).toHaveTextContent("Played");
    });

    it.each(STATUS_BADGE_TEST_CASES)(
      "should render $label chip as radio button",
      ({ label }) => {
        renderStatusChipGroupInForm();

        const chip = elements.getChipByLabel(label);
        expect(chip).toBeVisible();
        expect(chip).toHaveAttribute("type", "button");
      }
    );

    it("should have Played chip selected by default", () => {
      renderStatusChipGroupInForm(LibraryItemStatus.PLAYED);

      const playedChip = elements.getPlayedChip();
      expect(playedChip).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("given user selects a status chip", () => {
    it("should select Want to Play chip when clicked", async () => {
      renderStatusChipGroupInForm();

      await actions.selectWantToPlay();

      const wantToPlayChip = elements.getWantToPlayChip();
      expect(wantToPlayChip).toHaveAttribute("aria-checked", "true");
    });

    it("should select Owned chip when clicked", async () => {
      renderStatusChipGroupInForm();

      await actions.selectOwned();

      const ownedChip = elements.getOwnedChip();
      expect(ownedChip).toHaveAttribute("aria-checked", "true");
    });

    it("should select Playing chip when clicked", async () => {
      renderStatusChipGroupInForm();

      await actions.selectPlaying();

      const playingChip = elements.getPlayingChip();
      expect(playingChip).toHaveAttribute("aria-checked", "true");
    });

    it("should select Played chip when clicked", async () => {
      renderStatusChipGroupInForm(LibraryItemStatus.WANT_TO_PLAY);

      await actions.selectPlayed();

      const playedChip = elements.getPlayedChip();
      expect(playedChip).toHaveAttribute("aria-checked", "true");
    });

    it("should deselect previously selected chip when selecting a new one", async () => {
      renderStatusChipGroupInForm(LibraryItemStatus.PLAYING);

      const playingChip = elements.getPlayingChip();
      expect(playingChip).toHaveAttribute("aria-checked", "true");

      await actions.selectPlayed();

      expect(playingChip).toHaveAttribute("aria-checked", "false");
      expect(elements.getPlayedChip()).toHaveAttribute("aria-checked", "true");
    });

    it("should only have one chip selected at a time", async () => {
      renderStatusChipGroupInForm();

      await actions.selectPlaying();

      const chips = elements.getAllChips();
      const selectedChips = chips.filter(
        (chip) => chip.getAttribute("aria-checked") === "true"
      );

      expect(selectedChips).toHaveLength(1);
      expect(selectedChips[0]).toHaveTextContent("Playing");
    });
  });

  describe("given component renders with different default statuses", () => {
    it("should render with Want to Play selected when default is WANT_TO_PLAY", () => {
      renderStatusChipGroupInForm(LibraryItemStatus.WANT_TO_PLAY);

      const wantToPlayChip = elements.getWantToPlayChip();
      expect(wantToPlayChip).toHaveAttribute("aria-checked", "true");
    });

    it("should render with Owned selected when default is OWNED", () => {
      renderStatusChipGroupInForm(LibraryItemStatus.OWNED);

      const ownedChip = elements.getOwnedChip();
      expect(ownedChip).toHaveAttribute("aria-checked", "true");
    });

    it("should render with Playing selected when default is PLAYING", () => {
      renderStatusChipGroupInForm(LibraryItemStatus.PLAYING);

      const playingChip = elements.getPlayingChip();
      expect(playingChip).toHaveAttribute("aria-checked", "true");
    });

    it("should render with Played selected when default is PLAYED", () => {
      renderStatusChipGroupInForm(LibraryItemStatus.PLAYED);

      const playedChip = elements.getPlayedChip();
      expect(playedChip).toHaveAttribute("aria-checked", "true");
    });
  });
});
