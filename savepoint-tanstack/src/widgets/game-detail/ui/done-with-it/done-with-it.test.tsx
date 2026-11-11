import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StatusControl } from "@/entities/library-item";
import { useSetStatus } from "@/features/manage-library-entry";
import { DoneFlowProvider } from "@/widgets/done-flow";

import { DoneWithIt } from "./done-with-it";

const { setStatusFnMock, serverRow, harness } = vi.hoisted(() => ({
  setStatusFnMock: vi.fn(),
  serverRow: {
    status: "PLAYING" as "PLAYING" | "DONE",
    doneOutcome: null as "FINISHED" | "LET_GO" | null,
  },
  harness: { refresh: () => {} },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: async () => harness.refresh() }),
}));
vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => true,
}));
vi.mock("@/entities/session/api/get-session.server", () => ({
  getServerUserId: vi.fn(),
}));
vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: setStatusFnMock,
}));
vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/set-done-outcome-fn", () => ({
  setDoneOutcomeFn: vi.fn(),
}));

function Page() {
  const [row, setRow] = useState({ ...serverRow });
  harness.refresh = () => setRow({ ...serverRow });
  const libraryStatus = useSetStatus({
    id: 7,
    gameTitle: "Hades",
    status: row.status,
    upNextPosition: null,
  });
  return (
    <>
      <StatusControl
        status={libraryStatus.status}
        outcome={row.doneOutcome}
        showDoneOutcome
        onChange={() => {}}
      />
      {libraryStatus.status === "PLAYING" ? (
        <DoneWithIt libraryStatus={libraryStatus} />
      ) : null}
    </>
  );
}

const elements = {
  queryDoneWithIt: () =>
    screen.queryByRole("button", { name: "Done with it?" }),
  getDoneWithIt: () => screen.getByRole("button", { name: "Done with it?" }),
  getFinished: () => screen.getByRole("button", { name: "Finished" }),
  getLetItGo: () => screen.getByRole("button", { name: "Let it go" }),
  getNotYet: () => screen.getByRole("button", { name: "Not yet" }),
  queryFinished: () => screen.queryByRole("button", { name: "Finished" }),
  queryExplanation: () =>
    screen.queryByText("Both move it to Done. Only you see which one."),
  getDoneDialog: () => screen.findByRole("dialog", { name: "Hades is done" }),
  getOutcomeRadio: (name: string) => screen.getByRole("radio", { name }),
  getSkip: () => screen.getByRole("button", { name: "Skip" }),
  getStatusControl: () =>
    screen.getByRole("button", { name: /^Status: .*\. Change$/ }),
};

const actions = {
  openReasons: () => userEvent.click(elements.getDoneWithIt()),
};

describe("DoneWithIt", () => {
  beforeEach(() => {
    serverRow.status = "PLAYING";
    serverRow.doneOutcome = null;
    setStatusFnMock.mockReset();
    setStatusFnMock.mockImplementation(
      async ({ data }: { data: { doneOutcome?: "FINISHED" | "LET_GO" } }) => {
        serverRow.status = "DONE";
        serverRow.doneOutcome = data.doneOutcome ?? null;
        return {
          status: "DONE",
          upNextPosition: null,
          undo: { snapshot: {}, createdPlayId: null, closedPlayId: null },
        };
      }
    );
    render(
      <DoneFlowProvider>
        <Page />
      </DoneFlowProvider>
    );
  });

  describe("given a Playing game", () => {
    it("shows only the Done with it? button at first", () => {
      expect(elements.queryDoneWithIt()).toBeInTheDocument();
      expect(elements.queryFinished()).toBeNull();
    });
  });

  describe("given the user taps Done with it?", () => {
    beforeEach(async () => {
      await actions.openReasons();
    });

    it("replaces it with Finished, Let it go, the explanation and Not yet", () => {
      expect(elements.queryDoneWithIt()).toBeNull();
      expect(elements.getFinished()).toBeInTheDocument();
      expect(elements.getLetItGo()).toBeInTheDocument();
      expect(elements.queryExplanation()).toBeInTheDocument();
      expect(elements.getNotYet()).toBeInTheDocument();
    });

    describe("and then taps Not yet", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getNotYet());
      });

      it("puts Done with it? back and changes nothing", () => {
        expect(elements.queryDoneWithIt()).toBeInTheDocument();
        expect(elements.queryFinished()).toBeNull();
        expect(setStatusFnMock).not.toHaveBeenCalled();
        expect(elements.getStatusControl()).toHaveTextContent("Playing");
      });
    });

    describe("and then taps Let it go", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getLetItGo());
      });

      it("sets the game Done and opens the Done dialog with Let go selected", async () => {
        await elements.getDoneDialog();

        expect(elements.getOutcomeRadio("Let go")).toBeChecked();
        expect(elements.getOutcomeRadio("Finished")).not.toBeChecked();
      });

      it("leaves the game Done · Let go once the dialog is skipped", async () => {
        await elements.getDoneDialog();
        await userEvent.click(elements.getSkip());

        expect(elements.getStatusControl()).toHaveTextContent("Done · Let go");
      });
    });

    describe("and then taps Finished and closes the dialog with Skip", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getFinished());
        await elements.getDoneDialog();
        await userEvent.click(elements.getSkip());
      });

      it("leaves the game as Done · Finished", () => {
        expect(elements.getStatusControl()).toHaveTextContent(
          "Done · Finished"
        );
      });
    });
  });
});
