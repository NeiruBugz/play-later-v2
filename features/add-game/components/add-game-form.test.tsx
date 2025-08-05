import { server } from "@/test/setup/client-setup";
import { renderWithTestProviders } from "@/test/utils/test-provider";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AddGameForm } from "./add-game-form";

const BACKLOG_STATUS = [
  "Backlog",
  "Played",
  "Playing",
  "Completed",
  "Wishlist",
];

const ACQUISITION_TYPE = ["Physical", "Digital", "Subscription service"];

const elements = {
  getGamePickerHeading: () => screen.getByText("Add Game to Collection"),
  getGamePickerDescription: () =>
    screen.getByText(
      "Search for a game and configure how you want to track it in your collection."
    ),
  getEmptyStateHeading: () => screen.getByText("Select a game to continue"),
  getEmptyStateDescription: () =>
    screen.getByText(
      "Once you choose a game, you'll be able to set your platform preference, backlog status, and how you acquired the game."
    ),
  getGameSelectorInputLabel: () => screen.getByText("Search for a game"),
  getGameSelectorInput: () =>
    screen.getByPlaceholderText("Type at least 3 characters to search..."),
  getGameSelectorNotice: () =>
    screen.getByText("Search for games by title. Results from IGDB database."),
  getSearchProcessIndicator: () => screen.getByText("Searching games..."),
  getPopoverEmptyStateMessage: () => screen.getByText("No games found"),
  getPopoverEmptyStateDescription: (searchValue: string) =>
    screen.getByText(
      `Try searching for "${searchValue}" with different keywords`
    ),
  getSingleGameResult: (gameTitle: string) => screen.getByText(gameTitle),
  getReleaseDateForListItemType: (releaseDate: string) =>
    screen.getByText(`(${releaseDate})`),
  getChangeGameButton: () => screen.getByRole("button", { name: "Change" }),
  getFormHeading: () => screen.getByText("Game Details"),
  getFormDescription: () =>
    screen.getByText(
      "Configure how you want to track this game in your collection."
    ),
  getPlatformSelectTrigger: () =>
    screen.getByRole("combobox", { name: "Platform of choice" }),
  getStatusRadioGroupButton: (status: string) =>
    screen.getByRole("radio", { name: status }),
  getAcquisitionTypeRadioGroupButton: (status: string) =>
    screen.getByRole("radio", { name: status }),
  getFormSubmitButton: () =>
    screen.getByRole("button", {
      name: "Save",
    }),
  getFormResetButton: () => screen.getByRole("button", { name: "Reset" }),
  getPlatformOption: (platform: string) => screen.getByText(platform),
};

const actions = {
  inputClick: async () => userEvent.click(elements.getGameSelectorInput()),
  inputType: async (searchQuery: string) =>
    userEvent.type(elements.getGameSelectorInput(), searchQuery),
  resultClick: async (resultName: string) =>
    userEvent.click(elements.getSingleGameResult(resultName)),
  changeSelectedGame: async () =>
    userEvent.click(elements.getChangeGameButton()),
  triggerCombobox: async () =>
    userEvent.click(elements.getPlatformSelectTrigger()),
  changePlatform: async (platform: string) =>
    userEvent.click(elements.getPlatformOption(platform)),
  changeStatus: async (status: string) =>
    userEvent.click(elements.getStatusRadioGroupButton(status)),
  changeAcquisitionType: async (type: string) =>
    userEvent.click(elements.getAcquisitionTypeRadioGroupButton(type)),
  resetForm: async () => userEvent.click(elements.getFormResetButton()),
  submitForm: async () => userEvent.click(elements.getFormSubmitButton()),
};

const setupGameSelection = async (gameName = "Persona 3") => {
  await actions.inputClick();
  await actions.inputType("persona");

  await waitFor(() => {
    expect(elements.getSingleGameResult(gameName)).toBeVisible();
    expect(elements.getReleaseDateForListItemType("2008")).toBeVisible();
  });

  await actions.resultClick(gameName);
};

describe("AddGameForm", () => {
  beforeEach(() => {
    server.resetHandlers();
    renderWithTestProviders(<AddGameForm />);
    expect(elements.getGamePickerHeading()).toBeVisible();
    expect(elements.getGamePickerDescription()).toBeVisible();
  });
  describe("given empty form state", () => {
    it("should display empty state message", () => {
      expect(elements.getEmptyStateHeading()).toBeVisible();
      expect(elements.getEmptyStateDescription()).toBeVisible();
    });

    it("should display game selector form", () => {
      expect(elements.getGameSelectorInputLabel()).toBeVisible();
      expect(elements.getGameSelectorInput()).toBeVisible();
      expect(elements.getGameSelectorNotice()).toBeVisible();
    });
  });

  describe("given user interacts with game selector form", () => {
    it("should display loading state on typing", async () => {
      await actions.inputClick();
      await actions.inputType("persona");

      expect(elements.getSearchProcessIndicator()).toBeVisible();
    });

    it("should display empty state when no games found", async () => {
      const searchValue = "personasdasdass";

      await actions.inputClick();
      await actions.inputType(searchValue);

      await waitFor(() => {
        expect(elements.getPopoverEmptyStateMessage()).toBeVisible();
        expect(
          elements.getPopoverEmptyStateDescription(searchValue)
        ).toBeVisible();
      });
    });

    it("should display search results", async () => {
      await actions.inputClick();
      await actions.inputType("persona");

      await waitFor(() => {
        expect(elements.getSingleGameResult("Persona 3")).toBeVisible();
        expect(elements.getReleaseDateForListItemType("2008")).toBeVisible();
      });
    });
  });

  describe("given user selects game", () => {
    beforeEach(async () => {
      await setupGameSelection();
      await actions.resultClick("Persona 3");
    });

    it("should display selected game", async () => {
      await waitFor(() => {
        expect(elements.getSingleGameResult("Persona 3")).toBeVisible();
        expect(
          elements.getReleaseDateForListItemType("Mar 06, 2008")
        ).toBeVisible();
      });

      expect(elements.getChangeGameButton()).toBeVisible();
    });

    it("should display form fields with default values", async () => {
      await waitFor(() => {
        expect(elements.getFormHeading()).toBeVisible();
      });
      expect(elements.getFormDescription()).toBeVisible();
      expect(elements.getPlatformSelectTrigger()).toBeVisible();
      BACKLOG_STATUS.forEach((status) => {
        expect(elements.getStatusRadioGroupButton(status)).toBeVisible();
      });
      expect(elements.getStatusRadioGroupButton("Backlog")).toBeChecked();
      ACQUISITION_TYPE.forEach((type) => {
        expect(elements.getAcquisitionTypeRadioGroupButton(type)).toBeVisible();
      });
      expect(
        elements.getAcquisitionTypeRadioGroupButton("Digital")
      ).toBeChecked();
      expect(elements.getFormResetButton()).toBeVisible();
      expect(elements.getFormSubmitButton()).toBeVisible();
    });

    describe("when user changes form fields", () => {
      it("should change backlog status", async () => {
        const newStatus = "Completed";
        await actions.changeStatus(newStatus);

        await waitFor(() => {
          expect(elements.getStatusRadioGroupButton(newStatus)).toBeChecked();
          expect(
            elements.getStatusRadioGroupButton("Backlog")
          ).not.toBeChecked();
        });
      });

      it("should change acquisition type", async () => {
        const newType = "Physical";
        await actions.changeAcquisitionType(newType);

        await waitFor(() => {
          expect(
            elements.getAcquisitionTypeRadioGroupButton(newType)
          ).toBeChecked();
          expect(
            elements.getAcquisitionTypeRadioGroupButton("Digital")
          ).not.toBeChecked();
        });
      });
    });

    describe("when user resets form after changes", () => {
      beforeEach(async () => {
        await actions.changeStatus("Completed");
        await actions.changeAcquisitionType("Physical");
      });

      it("should reset form to initial state", async () => {
        await actions.resetForm();

        await waitFor(() => {
          expect(elements.getEmptyStateHeading()).toBeVisible();
          expect(elements.getEmptyStateDescription()).toBeVisible();
          expect(elements.getGameSelectorInputLabel()).toBeVisible();
          expect(elements.getGameSelectorInput()).toBeVisible();
          expect(elements.getGameSelectorNotice()).toBeVisible();
        });
      });
    });
  });

  describe("given game is selected when user clears selection", () => {
    beforeEach(async () => {
      await setupGameSelection();
      await actions.resultClick("Persona 3");
    });

    it("should return to empty state", async () => {
      await actions.changeSelectedGame();

      await waitFor(() => {
        expect(elements.getEmptyStateHeading()).toBeVisible();
        expect(elements.getEmptyStateDescription()).toBeVisible();
      });
    });
  });
});
