"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import { HiddenInput } from "@/shared/components/hidden-input";
import { Label } from "@/shared/components/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/radio-group";
import {
  AcquisitionStatusMapper,
  BacklogStatusMapper,
  cn,
  playingOnPlatforms,
} from "@/shared/lib";
import type { SearchResponse } from "@/shared/types";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { createGameAction } from "../server-actions/action";
import type { BacklogItemFormValues, GameFormValues } from "../types";
import { GamePicker } from "./game-picker";

const DEFAULT_PLATFORM_LIST: SearchResponse["platforms"] = [
  { id: 9999, name: "PC" },
  { id: 9998, name: "PlayStation" },
  { id: 9997, name: "Xbox" },
  { id: 9996, name: "Nintendo" },
  { id: 9995, name: "Other" },
];

export const initialFormValues: BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus.TO_PLAY,
  acquisitionType: AcquisitionType.DIGITAL,
  platform: "",
};

function SubmitButton({
  onFormReset,
  isDisabled,
}: {
  onFormReset: () => void;
  isDisabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <Button
        className="mr-2 mt-2"
        type="submit"
        disabled={isDisabled || pending}
      >
        Save
      </Button>
      <Button
        variant="secondary"
        onClick={onFormReset}
        className="mt-2"
        type="reset"
        disabled={isDisabled || pending}
      >
        Reset
      </Button>
    </>
  );
}

export function AddGameForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedGame, setSelectedGame] = useState<SearchResponse | undefined>(
    undefined
  );
  const [gameValues, setGameValues] = useState<GameFormValues>(undefined);
  const [backlogItemValues, setBacklogItemValues] =
    useState<BacklogItemFormValues>(initialFormValues);
  const [platformOptions, setPlatformOptions] = useState<
    SearchResponse["platforms"]
  >([]);

  const [state, formAction] = useActionState(createGameAction, {
    message: "",
    isError: false,
  });

  const updateFormValues = useCallback((newValues: Partial<GameFormValues>) => {
    setGameValues((prevState) => ({ ...prevState, ...newValues }));
  }, []);

  const onFormReset = useCallback(() => {
    setSelectedGame(undefined);
    setGameValues(undefined);
    setBacklogItemValues(initialFormValues);
    setPlatformOptions([]);
    formRef.current?.reset();
  }, []);

  useEffect(() => {
    if (state.message) {
      onFormReset();

      if (state.isError) {
        toast.error("Add Game", {
          description: state.message,
        });
      } else {
        toast.success("Add Game", {
          description: state.message,
        });
      }
    }
  }, [state.isError, state.message, onFormReset]);

  const onGameSelect = useCallback(
    (game?: SearchResponse) => {
      if (!game) {
        setSelectedGame(undefined);
        setGameValues(undefined);
        setBacklogItemValues(initialFormValues);
        setPlatformOptions([]);
        return;
      }

      setSelectedGame(game);
      updateFormValues({
        igdbId: game.id,
        title: game.name,
        coverImage: game.cover.image_id,
        releaseDate: game.first_release_date,
        description: game.summary,
      });
      setPlatformOptions(game.platforms ?? DEFAULT_PLATFORM_LIST);
    },
    [updateFormValues]
  );

  const onAcquisitionTypeChange = useCallback(
    (type: string) => {
      setBacklogItemValues((prevState) => ({
        ...prevState,
        acquisitionType: type as unknown as AcquisitionType,
      }));
    },
    [setBacklogItemValues]
  );

  const onBacklogStatusChange = useCallback(
    (status: string) => {
      setBacklogItemValues((prevState) => ({
        ...prevState,
        backlogStatus: status as unknown as BacklogItemStatus,
      }));
    },
    [setBacklogItemValues]
  );

  return (
    <div>
      <form action={formAction} ref={formRef}>
        <GamePicker
          clearSelection={() => onGameSelect(undefined)}
          onGameSelect={(game) => onGameSelect(game)}
          selectedGame={selectedGame}
        />
        <HiddenInput name="igdbId" value={gameValues?.igdbId} />
        <HiddenInput name="hltbId" value={gameValues?.hltbId} />
        <HiddenInput name="coverImage" value={gameValues?.coverImage} />
        <HiddenInput name="title" value={gameValues?.title} />
        <HiddenInput name="description" value={gameValues?.description} />
        <HiddenInput name="mainStory" value={gameValues?.mainStory} />
        <HiddenInput name="mainExtra" value={gameValues?.mainExtra} />
        <HiddenInput name="completionist" value={gameValues?.completionist} />
        <HiddenInput name="releaseDate" value={gameValues?.releaseDate} />
        <div className="mt-3">
          <div
            className={cn("relative mt-2 flex flex-col gap-4", {
              hidden: platformOptions.length === 0,
            })}
          >
            <Label htmlFor="platform">Platform of choice</Label>
            <Select name="platform" defaultValue={""}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform" className="mt-2" />
              </SelectTrigger>
              <SelectContent>
                {playingOnPlatforms.map((platform) => (
                  <SelectItem value={platform.value} key={platform.value}>
                    {platform.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-col gap-4">
            <Label htmlFor="acquisitionType">Acquisition type</Label>
            <RadioGroup
              className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
              defaultValue={backlogItemValues?.acquisitionType ?? "DIGITAL"}
              onValueChange={onAcquisitionTypeChange}
              id="acquisitionType"
              name="acquisitionType"
            >
              {Object.keys(AcquisitionType).map((key) => (
                <div key={key}>
                  <RadioGroupItem className="sr-only" id={key} value={key} />
                  <Label
                    className={cn(
                      "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                      "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      {
                        "bg-background text-foreground shadow-sm":
                          backlogItemValues?.acquisitionType === key,
                      }
                    )}
                    htmlFor={key}
                  >
                    {AcquisitionStatusMapper[key as unknown as AcquisitionType]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="mt-3 flex flex-col gap-4">
            <Label htmlFor="backlogStatus">Backlog Status</Label>
            <RadioGroup
              className="inline-flex h-fit w-fit flex-wrap items-center justify-start rounded-md bg-muted p-1 text-muted-foreground"
              defaultValue={backlogItemValues.backlogStatus ?? "TO_PLAY"}
              onValueChange={onBacklogStatusChange}
              id="backlogStatus"
              name="backlogStatus"
            >
              {Object.keys(BacklogItemStatus).map((key) => (
                <div key={key} className="w-fit">
                  <RadioGroupItem className="sr-only" id={key} value={key} />
                  <Label
                    className={cn(
                      "w-fit",
                      "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                      "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      {
                        "bg-background text-foreground shadow-sm":
                          backlogItemValues.backlogStatus === key,
                      }
                    )}
                    htmlFor={key}
                  >
                    {BacklogStatusMapper[key as unknown as BacklogItemStatus]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
        <SubmitButton
          onFormReset={onFormReset}
          isDisabled={selectedGame === undefined}
        />
      </form>
    </div>
  );
}
