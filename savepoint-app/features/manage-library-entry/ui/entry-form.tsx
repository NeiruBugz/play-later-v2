"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { LibraryItemDomain } from "@/features/library/types";
import { useGetPlatforms } from "@/features/manage-library-entry/hooks/use-get-platforms";
import { Button } from "@/shared/components/ui/button";
import { Form, FormField } from "@/shared/components/ui/form";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { getStatusLabel } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus, type PlatformDomain } from "@/shared/types";

import {
  AddToLibrarySchema,
  UpdateLibraryEntrySchema,
  type AddToLibraryInput,
  type UpdateLibraryEntryInput,
} from "../schemas";
import {
  addToLibraryAction,
  updateLibraryEntryAction,
} from "../server-actions";
import { DateFieldsCollapsible } from "./date-fields-collapsible";
import { InlineDeleteConfirm } from "./inline-delete-confirm";
import { PlatformCombobox } from "./platform-combobox";
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
  onAddPlatform?: () => void;
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
  onAddPlatform,
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
      filteredPlatforms={filteredPlatforms}
      isLoadingPlatforms={isLoadingPlatforms}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onDelete={onDelete}
      onAddPlatform={onAddPlatform}
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
      status: LibraryItemStatus.SHELF,
      platform: "",
    },
  });

  const { isSubmitting, handleSubmit } = useFormSubmission({
    action: addToLibraryAction,
    successMessage:
      existingPlatforms.length > 0 ? "Entry added" : "Added to library",
    successDescription:
      existingPlatforms.length > 0
        ? "A new library entry has been created."
        : `${gameTitle} has been added to your library.`,
    errorMessage: "Failed to add entry",
    onSuccess: () => {
      form.reset({
        igdbId,
        status: LibraryItemStatus.SHELF,
        platform: "",
      });
      onSuccess();
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("gap-lg sm:gap-2xl flex flex-col", className)}
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

        <div className="pt-md sm:pt-lg flex items-center justify-between">
          <div />
          <div className="gap-sm sm:gap-md flex items-center">
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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="sm:h-10 sm:px-4 sm:text-sm"
            >
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
  filteredPlatforms: {
    supportedPlatforms: PlatformDomain[];
    otherPlatforms: PlatformDomain[];
  };
  isLoadingPlatforms: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
  onDelete?: (id: number) => void;
  onAddPlatform?: () => void;
  className?: string;
}

function EditForm({
  entry,
  filteredPlatforms,
  isLoadingPlatforms,
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
      platform: entry.platform ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      libraryItemId: entry.id,
      status: entry.status,
      startedAt: entry.startedAt ?? undefined,
      completedAt: entry.completedAt ?? undefined,
      platform: entry.platform ?? "",
    });
  }, [entry, form]);

  const platformsForCombobox = useMemo(() => {
    const known = new Set([
      ...filteredPlatforms.supportedPlatforms.map((p) => p.name),
      ...filteredPlatforms.otherPlatforms.map((p) => p.name),
    ]);
    const isLegacy = !!entry.platform && !known.has(entry.platform);
    if (!isLegacy) {
      return filteredPlatforms;
    }
    const legacyOption = {
      id: "legacy",
      name: `${entry.platform} (legacy)`,
      slug: "legacy",
    } as unknown as PlatformDomain;
    return {
      supportedPlatforms: filteredPlatforms.supportedPlatforms,
      otherPlatforms: [legacyOption, ...filteredPlatforms.otherPlatforms],
    };
  }, [entry.platform, filteredPlatforms]);

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
        className={cn("gap-lg sm:gap-2xl flex flex-col", className)}
      >
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => {
            const isLegacy =
              !!entry.platform &&
              !platformsForCombobox.supportedPlatforms.some(
                (p) => p.name === entry.platform
              ) &&
              !platformsForCombobox.otherPlatforms.some(
                (p) =>
                  p.name !== `${entry.platform} (legacy)` &&
                  p.name === entry.platform
              );
            const displayValue =
              isLegacy && field.value === entry.platform
                ? `${entry.platform} (legacy)`
                : (field.value ?? "");
            return (
              <PlatformCombobox
                field={{
                  ...field,
                  value: displayValue,
                  onChange: (next: string) => {
                    if (next.endsWith(" (legacy)")) {
                      field.onChange(entry.platform);
                    } else {
                      field.onChange(next);
                    }
                  },
                }}
                supportedPlatforms={platformsForCombobox.supportedPlatforms}
                otherPlatforms={platformsForCombobox.otherPlatforms}
                isLoading={isLoadingPlatforms}
                description="Change the platform you'll play on"
              />
            );
          }}
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
          defaultExpanded={!!(entry.startedAt || entry.completedAt)}
        />

        <p className="text-muted-foreground border-border pt-md sm:pt-lg border-t text-xs">
          Added{" "}
          {new Date(entry.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {new Date(entry.updatedAt).getTime() !==
            new Date(entry.createdAt).getTime() && (
            <>
              {" "}
              · Updated{" "}
              {new Date(entry.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </>
          )}
        </p>

        {/* TODO: "Track on another platform" hidden — onAddPlatform handler is a no-op */}

        <div className="pt-md sm:pt-lg flex items-center justify-between">
          {onDelete ? (
            <InlineDeleteConfirm onConfirm={() => onDelete(entry.id)} />
          ) : (
            <div />
          )}

          <div className="gap-sm sm:gap-md flex items-center">
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
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="sm:h-10 sm:px-4 sm:text-sm"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
