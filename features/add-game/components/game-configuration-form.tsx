"use client";

import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { type UseFormReturn } from "react-hook-form";

import { Body, Heading } from "@/shared/components/typography";
import { Form } from "@/shared/components/ui/form";
import { AcquisitionStatusMapper, BacklogStatusMapper } from "@/shared/lib";

import { type CreateGameActionInput } from "../lib/validation";
import { SubmitButton } from "./add-game-form.submit";
import { PlatformSelector } from "./platform-selector";
import { RadioGroupField } from "./radio-group-field";

type GameConfigurationFormProps = {
  form: UseFormReturn<CreateGameActionInput>;
  onSubmit: (values: CreateGameActionInput) => void;
  onFormReset: () => void;
  isLoading: boolean;
};

export function GameConfigurationForm({
  form,
  onSubmit,
  onFormReset,
  isLoading,
}: GameConfigurationFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onSubmit)(e);
        }}
        className="space-y-8"
      >
        {/* Platform Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Heading level={3} size="md">
              Game Details
            </Heading>
            <Body size="sm" variant="muted">
              Configure how you want to track this game in your collection.
            </Body>
          </div>

          <PlatformSelector control={form.control} disabled={isLoading} />
        </div>

        {/* Backlog Status */}
        <div className="space-y-4">
          <RadioGroupField
            control={form.control}
            name="backlogStatus"
            label="Backlog status"
            description="What's your current status with this game?"
            options={Object.keys(BacklogItemStatus)}
            mapper={BacklogStatusMapper}
            disabled={isLoading}
          />
        </div>

        {/* Acquisition Type */}
        <div className="space-y-4">
          <RadioGroupField
            control={form.control}
            name="acquisitionType"
            label="Acquisition type"
            description="How did you acquire this game?"
            options={Object.keys(AcquisitionType)}
            mapper={AcquisitionStatusMapper}
            disabled={isLoading}
          />
        </div>

        {/* Submit Section */}
        <div className="border-t pt-6">
          <SubmitButton
            onFormReset={onFormReset}
            isDisabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </form>
    </Form>
  );
}
