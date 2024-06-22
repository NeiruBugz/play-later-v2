'use client';

import { SearchResponse } from "@/src/shared/types";
import { GamePicker } from "@/src/widgets/game-picker";
import type { Game } from "@prisma/client";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { type HTMLAttributes, useCallback, useEffect, useState } from "react";
import { useHowLongToBeatSearch } from "@/src/features/search/api";
import { Label } from "@/src/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/shared/ui/radio-group";
import { AcquisitionStatusMapper, BacklogStatusMapper, cn } from "@/src/shared/lib";
import { Button } from "@/src/shared/ui/button";
import { useFormState, useFormStatus } from 'react-dom';
import { createGameAction } from "../api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/shared/ui/select"
import { useToast } from "@/src/shared/ui/use-toast";

type HiddenInputProps = {
  name: string;
  value: HTMLAttributes<HTMLInputElement>['defaultValue'] | null | undefined;
};

function HiddenInput({ name, value }: HiddenInputProps) {
  return (
    <input type="text" className="sr-only" name={name} defaultValue={value ?? ''}/>
  )
}

type GameFormValues = Partial<Omit<Game, 'releaseDate'> & { releaseDate: number }> | undefined;
type BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus;
  acquisitionType: AcquisitionType;
  platform?: string;
}

const initialFormValues: BacklogItemFormValues = {
  backlogStatus: BacklogItemStatus.TO_PLAY,
  acquisitionType: AcquisitionType.DIGITAL,
  platform: "",
};

export function AddGameForm() {
  const [selectedGame, setSelectedGame] = useState<SearchResponse | undefined>(undefined);
  const [gameValues, setGameValues] = useState<GameFormValues>(undefined);
  const [backlogItemValues, setBacklogItemValues] = useState<BacklogItemFormValues>(initialFormValues);
  const [platformOptions, setPlatformOptions] = useState<SearchResponse['platforms']>([]);

  const [state, formAction] = useFormState(createGameAction, { message: "", isError: false });
  const { pending } = useFormStatus();
  const { toast } = useToast();

  const { data: howLongToBeatData } = useHowLongToBeatSearch(gameValues?.title);

  const updateFormValues = useCallback((newValues: Partial<GameFormValues>) => {
    setGameValues((prevState) => ({ ...prevState, ...newValues }));
  }, []);

  useEffect(() => {
    if (state.message) {
      setSelectedGame(undefined);
      setBacklogItemValues(initialFormValues);
      setGameValues(undefined);
      setPlatformOptions([])
    }

    toast({
      title: "Add Game",
      description: state.message,
      variant: state.isError ? "destructive" : "default",
    })
  }, [state.message]);


  useEffect(() => {
    if (howLongToBeatData) {
      updateFormValues({
        hltbId: howLongToBeatData.id,
        mainStory: howLongToBeatData.mainStory,
        mainExtra: howLongToBeatData.mainExtra,
        completionist: howLongToBeatData.completionist,
      });
    }
  }, [howLongToBeatData, updateFormValues]);

  const onGameSelect = useCallback((game?: SearchResponse) => {
    if (!game) {
      setSelectedGame(undefined);
      setGameValues(undefined);
      setBacklogItemValues(initialFormValues);
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
    setPlatformOptions(game.platforms);
  }, [updateFormValues]);

  const onAcquisitionTypeChange = useCallback((type: string) => {
    setBacklogItemValues((prevState) => ({ ...prevState, acquisitionType: type as unknown as AcquisitionType }));
  }, [setBacklogItemValues]);

  const onBacklogStatusChange = useCallback((status: string) => {
    setBacklogItemValues((prevState) => ({ ...prevState, backlogStatus: status as unknown as BacklogItemStatus }));
  }, [setBacklogItemValues])

  return (
    <div>
      <form action={formAction}>
        <GamePicker
          clearSelection={() => onGameSelect(undefined)}
          onGameSelect={(game) => onGameSelect(game)}
          selectedGame={selectedGame}
        />
        <HiddenInput name="igdbId" value={gameValues?.igdbId}/>
        <HiddenInput name="hltbId" value={gameValues?.hltbId}/>
        <HiddenInput name="coverImage" value={gameValues?.coverImage}/>
        <HiddenInput name="title" value={gameValues?.title}/>
        <HiddenInput name="description" value={gameValues?.description}/>
        <HiddenInput name="mainStory" value={gameValues?.mainStory}/>
        <HiddenInput name="mainExtra" value={gameValues?.mainExtra}/>
        <HiddenInput name="completionist" value={gameValues?.completionist}/>
        <HiddenInput name="releaseDate" value={gameValues?.releaseDate}/>
        <div className="mt-2">
          <div className={cn("flex flex-col gap-2 relative mt-2", { hidden: platformOptions.length === 0 })}>
            <Label htmlFor="platform">Platform of choice</Label>
            <Select name="platform" defaultValue={backlogItemValues.platform}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform"
                             className="mt-2"/>
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((platform) => (
                  <SelectItem value={platform.name} key={platform.id}>{platform.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Label htmlFor="acquisitionType">Acquisition type</Label>
            <RadioGroup
              className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit"
              defaultValue={backlogItemValues?.acquisitionType ?? "DIGITAL"}
              onValueChange={onAcquisitionTypeChange}
              id="acquisitionType"
              name="acquisitionType"
            >
              {Object.keys(AcquisitionType).map((key) => (
                <div key={key}>
                  <RadioGroupItem
                    className="sr-only"
                    id={key}
                    value={key}
                  />
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
                </div>))}
            </RadioGroup>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Label htmlFor="backlogStatus">Backlog Status</Label>
            <RadioGroup
              className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit"
              defaultValue={backlogItemValues.backlogStatus ?? "TO_PLAY"}
              onValueChange={onBacklogStatusChange}
              id="backlogStatus"
              name="backlogStatus"
            >
              {Object.keys(BacklogItemStatus).map((key) => (
                <div key={key}>
                  <RadioGroupItem
                    className="sr-only"
                    id={key}
                    value={key}
                  />
                  <Label
                    className={cn(
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
                </div>))}
            </RadioGroup>
          </div>
        </div>
        <Button className="mt-2" type="submit" disabled={selectedGame === undefined || pending}>Save</Button>
      </form>
    </div>
  );
}
