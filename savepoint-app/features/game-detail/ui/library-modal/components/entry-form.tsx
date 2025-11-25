"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useGetPlatforms } from "@/features/game-detail/hooks/use-get-platforms";
import { Button } from "@/shared/components/ui/button";
import { Form, FormField } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { getStatusLabel } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus, type LibraryItemDomain, type PlatformDomain } from "@/shared/types";

import {
  AddToLibrarySchema,
  UpdateLibraryEntrySchema,
  type AddToLibraryInput,
  type UpdateLibraryEntryInput,
} from "../../../schemas";
import { addToLibraryAction, updateLibraryEntryAction } from "../../../server-actions";
import { PlatformCombobox } from "../platform-combobox";
import { DateFieldsCollapsible } from "./date-fields-collapsible";
import { InlineDeleteConfirm } from "./inline-delete-confirm";
import { StatusChipGroup } from "./status-chip-group";

interface EntryFormProps {
  igdbId: number;
  gameTitle: string;
  entry: LibraryItemDomain | null;
  isAddMode: boolean;
  existingPlatforms: string[];
  onSuccess: () => void;
  onCancel?: () => void;
  onDelete?: (id: number) => void;
  className?: string;
}

export function EntryForm({
  igdbId,
  gameTitle,
  entry,
  isAddMode,
  existingPlatforms,
  onSuccess,
  onCancel,
  onDelete,
  className,
}: EntryFormProps) {
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

  const filteredPlatforms = useMemo(() => {
    const supported = platformsData?.supportedPlatforms ?? [];
    const other = platformsData?.otherPlatforms ?? [];

    if (isAddMode) {
      return {
        supportedPlatforms: supported.filter(
          (p) => !existingPlatforms.includes(p.name)
        ),
        otherPlatforms: other.filter(
          (p) => !existingPlatforms.includes(p.name)
        ),
      };
    }

    return { supportedPlatforms: supported, otherPlatforms: other };
  }, [platformsData, existingPlatforms, isAddMode]);

  if (isAddMode) {
    return (
      <AddForm
        igdbId={igdbId}
        gameTitle={gameTitle}
        existingPlatforms={existingPlatforms}
        filteredPlatforms={filteredPlatforms}
        isLoadingPlatforms={isLoadingPlatforms}
        onSuccess={onSuccess}
        onCancel={onCancel}
        className={className}
      />
    );
  }

  if (!entry) {
    return null;
  }

  return (
    <EditForm
      entry={entry}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onDelete={onDelete}
      className={className}
    />
  );
}

interface AddFormProps {
  igdbId: number;
  gameTitle: string;
  existingPlatforms: string[];
  filteredPlatforms: {
    supportedPlatforms: PlatformDomain[];
    otherPlatforms: PlatformDomain[];
  };
  isLoadingPlatforms: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  className?: string;
}

function AddForm({
  igdbId,
  gameTitle,
  existingPlatforms,
  filteredPlatforms,
  isLoadingPlatforms,
  onSuccess,
  onCancel,
  className,
}: AddFormProps) {
  const form = useForm<AddToLibraryInput>({
    resolver: zodResolver(AddToLibrarySchema),
    defaultValues: {
      igdbId,
      status: LibraryItemStatus.CURIOUS_ABOUT,
      platform: "",
    },
  });

  const { isSubmitting, handleSubmit } = useFormSubmission({
    action: addToLibraryAction,
    successMessage: existingPlatforms.length > 0 ? "Entry added" : "Added to library",
    successDescription: existingPlatforms.length > 0
      ? "A new library entry has been created."
      : `${gameTitle} has been added to your library.`,
    errorMessage: "Failed to add entry",
    onSuccess: () => {
      form.reset({
        igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "",
      });
      onSuccess();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("flex flex-col gap-lg sm:gap-2xl", className)}
      >
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <PlatformCombobox
              field={field}
              supportedPlatforms={filteredPlatforms.supportedPlatforms}
              otherPlatforms={filteredPlatforms.otherPlatforms}
              isLoading={isLoadingPlatforms}
            />
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => <StatusChipGroup field={field} />}
        />

        <DateFieldsCollapsible
          startedValue={form.watch("startedAt")}
          completedValue={form.watch("completedAt")}
          onStartedChange={(date) => form.setValue("startedAt", date)}
          onCompletedChange={(date) => form.setValue("completedAt", date)}
        />

        <div className="flex items-center justify-between pt-md sm:pt-lg">
          <div />
          <div className="flex items-center gap-sm sm:gap-md">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="sm:h-10 sm:px-4 sm:text-sm"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting} className="sm:h-10 sm:px-4 sm:text-sm">
              {isSubmitting
                ? "Adding..."
                : existingPlatforms.length > 0
                  ? "Add Entry"
                  : "Add to Library"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

interface EditFormProps {
  entry: LibraryItemDomain;
  onSuccess: () => void;
  onCancel?: () => void;
  onDelete?: (id: number) => void;
  className?: string;
}

function EditForm({
  entry,
  onSuccess,
  onCancel,
  onDelete,
  className,
}: EditFormProps) {
  const form = useForm<UpdateLibraryEntryInput>({
    resolver: zodResolver(UpdateLibraryEntrySchema),
    defaultValues: {
      libraryItemId: entry.id,
      status: entry.status,
      startedAt: entry.startedAt ?? undefined,
      completedAt: entry.completedAt ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      libraryItemId: entry.id,
      status: entry.status,
      startedAt: entry.startedAt ?? undefined,
      completedAt: entry.completedAt ?? undefined,
    });
  }, [entry, form]);

  const { isSubmitting, handleSubmit } = useFormSubmission({
    action: updateLibraryEntryAction,
    successMessage: "Entry updated",
    successDescription: (data) =>
      `Status updated to ${getStatusLabel(data.status)}.`,
    errorMessage: "Failed to update entry",
    onSuccess,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("flex flex-col gap-lg sm:gap-2xl", className)}
      >
        <div className="space-y-sm">
          <Label className="text-muted-foreground text-sm">Platform</Label>
          <Input
            value={entry.platform ?? "Not specified"}
            disabled
            className="bg-muted cursor-not-allowed"
            aria-readonly="true"
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => <StatusChipGroup field={field} />}
        />

        <DateFieldsCollapsible
          startedValue={form.watch("startedAt")}
          completedValue={form.watch("completedAt")}
          onStartedChange={(date) => form.setValue("startedAt", date)}
          onCompletedChange={(date) => form.setValue("completedAt", date)}
          defaultExpanded={!!(entry.startedAt || entry.completedAt)}
        />

        <p className="text-muted-foreground border-t border-border pt-md sm:pt-lg text-xs">
          Added{" "}
          {entry.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {entry.updatedAt.getTime() !== entry.createdAt.getTime() && (
            <>
              {" "}
              · Updated{" "}
              {entry.updatedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </>
          )}
        </p>

        <div className="flex items-center justify-between pt-md sm:pt-lg">
          {onDelete ? (
            <InlineDeleteConfirm onConfirm={() => onDelete(entry.id)} />
          ) : (
            <div />
          )}

          <div className="flex items-center gap-sm sm:gap-md">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="sm:h-10 sm:px-4 sm:text-sm"
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={isSubmitting} className="sm:h-10 sm:px-4 sm:text-sm">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
