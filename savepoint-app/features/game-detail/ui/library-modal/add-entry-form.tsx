import { zodResolver } from "@hookform/resolvers/zod";
import { LibraryItemStatus } from "@prisma/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";
import { Form, FormField } from "@/shared/components/ui/form";

import { AddToLibrarySchema, type AddToLibraryInput } from "../../schemas";
import { addToLibraryAction } from "../../server-actions";
import { StatusSelect } from "./status-select";

type AddEntryFormProps = {
  igdbId: number;
  gameTitle: string;
  isEditMode?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
};

export const AddEntryForm = ({
  igdbId,
  gameTitle,
  isEditMode = false,
  onSuccess,
  onCancel,
}: AddEntryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddToLibraryInput>({
    resolver: zodResolver(AddToLibrarySchema),
    defaultValues: {
      igdbId,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: undefined,
    },
  });

  const onSubmit = async (data: AddToLibraryInput) => {
    try {
      setIsSubmitting(true);

      const result = await addToLibraryAction(data);

      if (result.success) {
        const toastTitle = isEditMode
          ? "New entry added"
          : "Game added to library";
        const toastDescription = isEditMode
          ? "A new library entry has been created."
          : `${gameTitle} has been added to your library.`;

        toast.success(toastTitle, { description: toastDescription });

        form.reset({
          igdbId,
          status: LibraryItemStatus.CURIOUS_ABOUT,
          platform: undefined,
        });
        onSuccess();
      } else {
        toast.error("Failed to add game", { description: result.error });
      }
    } catch (error) {
      toast.error("An unexpected error occurred", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {isEditMode && (
          <div className="bg-muted/50 border-primary/20 rounded-md border-2 border-dashed p-3 text-sm">
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
              className={isEditMode ? "py-6 text-left" : undefined}
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
