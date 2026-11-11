import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent, type KeyboardEvent } from "react";

import { invalidateCurrentUser, useEveningMinutes } from "@/entities/session";
import { setEveningLengthFn } from "@/features/set-evening-length";
import {
  EVENING_MINUTES_CHOICES,
  formatEveningLengthInput,
  formatEvenings,
  parseEveningLengthInput,
  type EveningLengthUnit,
} from "@/shared/lib/evenings";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

const EXAMPLE_GAME_HOURS = 14.5;
const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;
const RANGE_ERROR = "Enter a length between 30 minutes and 6 hours.";
const EMPTY_FIELD = { value: "", unit: "minutes" } as const;

export const Route = createFileRoute("/_authed/settings/play")({
  component: SettingsPlayPage,
});

type CustomLengthField = { value: string; unit: EveningLengthUnit };

function formatHours(minutes: number) {
  return `${minutes / MINUTES_PER_HOUR} h`;
}

function isPreset(minutes: number) {
  return (EVENING_MINUTES_CHOICES as readonly number[]).includes(minutes);
}

function SettingsPlayPage() {
  const queryClient = useQueryClient();
  const eveningMinutes = useEveningMinutes();
  const [draft, setDraft] = useState<CustomLengthField | null>(null);
  const [hasRangeError, setHasRangeError] = useState(false);
  const saveEveningLength = useMutation({
    mutationFn: (minutes: number) =>
      setEveningLengthFn({ data: { eveningMinutes: minutes } }),
    onSuccess: async () => {
      await invalidateCurrentUser(queryClient);
      setDraft(null);
    },
  });

  const storedField: CustomLengthField = isPreset(eveningMinutes)
    ? EMPTY_FIELD
    : formatEveningLengthInput(eveningMinutes);
  const field = draft ?? storedField;
  const previewMinutes =
    parseEveningLengthInput(field.value, field.unit) ?? eveningMinutes;

  const exampleEvenings = formatEvenings(
    EXAMPLE_GAME_HOURS * SECONDS_PER_HOUR,
    previewMinutes
  )?.replace(/^About/, "about");

  const commit = (candidate: CustomLengthField) => {
    const minutes = parseEveningLengthInput(candidate.value, candidate.unit);
    if (minutes === null) {
      setHasRangeError(true);
      return;
    }
    setHasRangeError(false);
    if (minutes !== eveningMinutes) {
      saveEveningLength.mutate(minutes);
    } else {
      setDraft(null);
    }
  };

  const choosePreset = (minutes: number) => {
    setHasRangeError(false);
    setDraft(EMPTY_FIELD);
    saveEveningLength.mutate(minutes);
  };

  const changeValue = (event: ChangeEvent<HTMLInputElement>) => {
    setHasRangeError(false);
    setDraft({ ...field, value: event.target.value });
  };

  const changeUnit = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = { ...field, unit: event.target.value as EveningLengthUnit };
    setDraft(next);
    if (next.value !== "") {
      commit(next);
    }
  };

  const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit(field);
    }
  };

  const commitOnBlur = () => {
    if (draft !== null) {
      commit(draft);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">How long is an evening for you?</h2>
      <RadioGroup
        aria-label="Evening length"
        value={isPreset(eveningMinutes) ? eveningMinutes : null}
        onValueChange={(minutes) => choosePreset(Number(minutes))}
      >
        {EVENING_MINUTES_CHOICES.map((minutes) => (
          <RadioGroupItem key={minutes} value={minutes}>
            {formatHours(minutes)}
          </RadioGroupItem>
        ))}
      </RadioGroup>
      <div className="space-y-2">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="custom-evening-length">Custom length</Label>
            <Input
              id="custom-evening-length"
              type="number"
              inputMode="decimal"
              step="any"
              value={field.value}
              aria-invalid={hasRangeError}
              onChange={changeValue}
              onKeyDown={commitOnEnter}
              onBlur={commitOnBlur}
            />
          </div>
          <div className="w-32 space-y-2">
            <Label htmlFor="custom-evening-unit">Unit</Label>
            <select
              id="custom-evening-unit"
              value={field.unit}
              onChange={changeUnit}
              className={cn(
                "h-11 w-full rounded-4xl border border-input bg-input/30 px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring md:h-9 md:text-sm dark:bg-input/30 dark:[&>option]:bg-popover"
              )}
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
            </select>
          </div>
        </div>
        {hasRangeError ? (
          <p role="alert" className="text-sm text-destructive">
            {RANGE_ERROR}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        A {EXAMPLE_GAME_HOURS}-hour game is {exampleEvenings}.
      </p>
    </div>
  );
}
