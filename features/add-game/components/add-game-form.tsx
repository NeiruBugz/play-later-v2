"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { type SearchResponse } from "@/shared/types";

import { initialFormValues } from "../lib/constants";
import {
  CreateGameActionSchema,
  type CreateGameActionInput,
} from "../lib/validation";
import { createGameAction } from "../server-actions/create-game-action";
import { EmptyState } from "./empty-state";
import { GameConfigurationForm } from "./game-configuration-form";
import { GameSelectionSection } from "./game-selection-section";

export function AddGameForm() {
  const [selectedGame, setSelectedGame] = useState<SearchResponse | undefined>(
    undefined
  );
  const { execute, isExecuting } = useAction(createGameAction, {
    onError: (result) => {
      toast.error(result.error.serverError);
    },
    onSuccess: (result) => {
      toast.success(
        `"${result.data.gameTitle}" has been added to your collection!`
      );
      onFormReset();
    },
  });

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

    execute({
      ...values,
      igdbId: selectedGame.id,
    });
  };

  const isLoading = isExecuting || form.formState.isSubmitting;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <GameSelectionSection
        selectedGame={selectedGame}
        onGameSelect={onGameSelect}
        disabled={isLoading}
      />

      <div className="space-y-6">
        {!selectedGame ? (
          <EmptyState />
        ) : (
          <GameConfigurationForm
            form={form}
            onSubmit={onSubmit}
            onFormReset={onFormReset}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
