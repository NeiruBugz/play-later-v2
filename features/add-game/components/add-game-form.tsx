"use client";

import { SubmitButton } from "@/features/add-game/components/add-game-form.submit";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components";
import { RadioGroup, RadioGroupItem } from "@/shared/components/radio-group";
import { Body, Heading } from "@/shared/components/typography";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  AcquisitionStatusMapper,
  BacklogStatusMapper,
  cn,
  playingOnPlatforms,
} from "@/shared/lib";
import type { SearchResponse } from "@/shared/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { initialFormValues } from "../lib/constants";
import {
  CreateGameActionSchema,
  type CreateGameActionInput,
} from "../lib/validation";
import { createGameAction } from "../server-actions/action";
import { GamePicker } from "./game-picker";

const radioGroupContainerStyles =
  "inline-flex h-10 w-fit items-center justify-center rounded-md bg-muted p-1 text-muted-foreground";

const radioGroupLabelStyles = cn(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
  "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
);

export function AddGameForm() {
  const [isPending, startTransition] = useTransition();
  const [selectedGame, setSelectedGame] = useState<SearchResponse | undefined>(
    undefined
  );

  const form = useForm<CreateGameActionInput>({
    resolver: zodResolver(CreateGameActionSchema),
    defaultValues: { ...initialFormValues, igdbId: undefined },
  });

  const onFormReset = () => {
    setSelectedGame(undefined);
    form.reset({ ...initialFormValues, igdbId: undefined });
  };

  const onGameSelect = (game?: SearchResponse) => {
    if (!game) {
      setSelectedGame(undefined);
      form.reset();
      return;
    }

    setSelectedGame(game);
    form.setValue("igdbId", game.id);
  };

  const onSubmit = (values: CreateGameActionInput) => {
    if (!selectedGame) {
      toast.error("Please select a game first");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createGameAction(values);

        if (result?.data) {
          toast.success(
            `"${result.data.gameTitle}" has been added to your collection!`
          );
          onFormReset();
        } else if (result?.serverError) {
          toast.error(result.serverError);
        } else if (result?.validationErrors) {
          toast.error(
            "Invalid input data. Please check your form and try again."
          );
        }
      } catch (error) {
        console.error("Failed to submit form:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const isLoading = isPending || form.formState.isSubmitting;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Game Selection Section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Heading level={2} size="lg">
            Add Game to Collection
          </Heading>
          <Body variant="muted">
            Search for a game and configure how you want to track it in your
            collection.
          </Body>
        </div>

        <GamePicker
          clearSelection={() => onGameSelect(undefined)}
          onGameSelect={(game) => onGameSelect(game)}
          selectedGame={selectedGame}
          disabled={isLoading}
        />
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        {!selectedGame ? (
          // Preview state when no game is selected
          <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8">
            <div className="space-y-3 text-center">
              <div className="text-muted-foreground">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <Heading level={3} size="md">
                Select a game to continue
              </Heading>
              <Body size="sm" variant="muted" className="mx-auto max-w-sm">
                Once you choose a game, you&apos;ll be able to set your platform
                preference, backlog status, and how you acquired the game.
              </Body>
            </div>
          </div>
        ) : (
          // Actual form when game is selected
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Platform Selection */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Heading level={3} size="md">
                    Game Details
                  </Heading>
                  <Body size="sm" variant="muted">
                    Configure how you want to track this game in your
                    collection.
                  </Body>
                </div>

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        htmlFor={field.name}
                        className="text-base font-medium"
                      >
                        Platform of choice
                      </FormLabel>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Which platform are you planning to play this game on?
                      </p>
                      <Select
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger id={field.name} className="h-11">
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {playingOnPlatforms.map((platform) => (
                            <SelectItem
                              value={platform.value}
                              key={platform.value}
                            >
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Backlog Status */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="backlogStatus"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-medium">
                        Backlog status
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        What&apos;s your current status with this game?
                      </p>
                      <FormControl id={field.name}>
                        <RadioGroup
                          id={field.name}
                          name={field.name}
                          onValueChange={field.onChange}
                          value={field.value}
                          className={radioGroupContainerStyles}
                          disabled={isLoading}
                        >
                          {Object.keys(BacklogItemStatus).map((key) => (
                            <FormItem key={key}>
                              <FormControl>
                                <RadioGroupItem
                                  className="sr-only"
                                  value={key}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormLabel
                                className={cn(radioGroupLabelStyles, {
                                  "bg-background text-foreground shadow-sm":
                                    field.value === key,
                                  "opacity-50": isLoading,
                                })}
                              >
                                {
                                  BacklogStatusMapper[
                                    key as unknown as BacklogItemStatus
                                  ]
                                }
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Acquisition Type */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="acquisitionType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel
                        htmlFor={field.name}
                        className="text-base font-medium"
                      >
                        Acquisition type
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        How did you acquire this game?
                      </p>
                      <FormControl id={field.name}>
                        <RadioGroup
                          id={field.name}
                          name={field.name}
                          onValueChange={field.onChange}
                          value={field.value}
                          className={radioGroupContainerStyles}
                          disabled={isLoading}
                        >
                          {Object.keys(AcquisitionType).map((key) => (
                            <FormItem key={key}>
                              <FormControl>
                                <RadioGroupItem
                                  className="sr-only"
                                  value={key}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormLabel
                                className={cn(radioGroupLabelStyles, {
                                  "bg-background text-foreground shadow-sm":
                                    field.value === key,
                                  "opacity-50": isLoading,
                                })}
                              >
                                {
                                  AcquisitionStatusMapper[
                                    key as unknown as AcquisitionType
                                  ]
                                }
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Section */}
              <div className="border-t pt-6">
                <SubmitButton
                  onFormReset={onFormReset}
                  isDisabled={selectedGame === undefined || isLoading}
                  isLoading={isLoading}
                />
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
