import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";
import { Form, FormField } from "@/shared/components/ui/form";
import { useGetPlatforms } from "@/shared/hooks/game";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { LibraryItemStatus } from "@/shared/types";

import { AddToLibrarySchema, type AddToLibraryInput } from "../schemas";
import { addToLibraryAction } from "../server-actions";
import type { AddEntryFormProps } from "./add-entry-form.types";
import { DateField } from "./date-field";
import { PlatformCombobox } from "./platform-combobox";
import { StatusSelect } from "./status-select";

export const AddEntryForm = ({
  igdbId,
  gameTitle,
  isEditMode = false,
  onSuccess,
  onCancel,
}: AddEntryFormProps) => {
  const form = useForm<AddToLibraryInput>({
    resolver: zodResolver(AddToLibrarySchema),
    defaultValues: {
      igdbId,
      status: LibraryItemStatus.PLAYED,
      platform: undefined,
    },
  });
  const {
    data: platformsData,
    isLoading: isLoadingPlatforms,
    error: platformsError,
  } = useGetPlatforms(igdbId);
  useEffect(() => {
    if (platformsError) {
      toast.error("Failed to load platforms", {
        description:
          platformsError instanceof Error
            ? platformsError.message
            : "Please try again later.",
      });
    }
  }, [platformsError]);
  const supportedPlatforms = platformsData?.supportedPlatforms ?? [];
  const otherPlatforms = platformsData?.otherPlatforms ?? [];
  const { isSubmitting, handleSubmit } = useFormSubmission({
    action: addToLibraryAction,
    successMessage: isEditMode ? "New entry added" : "Game added to library",
    successDescription: isEditMode
      ? "A new library entry has been created."
      : `${gameTitle} has been added to your library.`,
    errorMessage: "Failed to add game",
    onSuccess: () => {
      form.reset({
        igdbId,
        status: LibraryItemStatus.PLAYED,
        platform: undefined,
      });
      onSuccess();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-xl">
        {isEditMode && (
          <div className="bg-muted/50 border-primary/20 p-lg rounded-md border-2 border-dashed text-sm">
            <p className="text-muted-foreground">
              Add another library entry for {gameTitle}. This is useful if you
              own the game on multiple platforms or want to track separate
              playthroughs.
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <StatusSelect
              field={field}
              className={isEditMode ? "py-2xl text-left" : undefined}
            />
          )}
        />
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <PlatformCombobox
              field={field}
              supportedPlatforms={supportedPlatforms}
              otherPlatforms={otherPlatforms}
              isLoading={isLoadingPlatforms}
            />
          )}
        />
        <FormField
          control={form.control}
          name="startedAt"
          render={({ field }) => (
            <DateField
              field={field}
              label="Started At (Optional)"
              description="When did you start playing?"
            />
          )}
        />
        <FormField
          control={form.control}
          name="completedAt"
          render={({ field }) => (
            <DateField
              field={field}
              label="Completed At (Optional)"
              description="When did you finish?"
            />
          )}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Adding..."
              : isEditMode
                ? "Add Entry"
                : "Add to Library"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
