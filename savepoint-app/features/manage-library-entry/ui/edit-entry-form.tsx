import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";
import { Form, FormField } from "@/shared/components/ui/form";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { getStatusLabel } from "@/shared/lib/library-status";
import type { PlatformDomain } from "@/shared/types";

import { useGetPlatforms } from "../hooks/use-get-platforms";
import {
  UpdateLibraryEntrySchema,
  type UpdateLibraryEntryInput,
} from "../schemas";
import { updateLibraryEntryAction } from "../server-actions";
import { DateField } from "./date-field";
import type { EditEntryFormProps } from "./edit-entry-form.types";
import { LibraryEntryMetadata } from "./library-entry-metadata";
import { PlatformCombobox } from "./platform-combobox";
import { StatusSelect } from "./status-select";

export const EditEntryForm = ({
  item,
  igdbId,
  onSuccess,
  onCancel,
}: EditEntryFormProps) => {
  const form = useForm<UpdateLibraryEntryInput>({
    resolver: zodResolver(UpdateLibraryEntrySchema),
    defaultValues: {
      libraryItemId: item.id,
      status: item.status,
      startedAt: item.startedAt ?? undefined,
      completedAt: item.completedAt ?? undefined,
      platform: item.platform ?? "",
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

  const platformsForCombobox = useMemo(() => {
    const supported = platformsData?.supportedPlatforms ?? [];
    const other = platformsData?.otherPlatforms ?? [];
    const known = new Set([
      ...supported.map((p) => p.name),
      ...other.map((p) => p.name),
    ]);
    const isLegacy = !!item.platform && !known.has(item.platform);
    if (!isLegacy) {
      return { supportedPlatforms: supported, otherPlatforms: other };
    }
    const legacyOption = {
      id: "legacy",
      name: `${item.platform} (legacy)`,
      slug: "legacy",
    } as unknown as PlatformDomain;
    return {
      supportedPlatforms: supported,
      otherPlatforms: [legacyOption, ...other],
    };
  }, [item.platform, platformsData]);

  const { isSubmitting, handleSubmit } = useFormSubmission({
    action: updateLibraryEntryAction,
    successMessage: "Library entry updated",
    successDescription: (data) =>
      `Status updated to ${getStatusLabel(data.status)}.`,
    errorMessage: "Failed to update entry",
    onSuccess,
  });
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-xl">
        <LibraryEntryMetadata item={item} />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <StatusSelect
              field={field}
              description="Update your journey status for this entry"
              className="py-2xl text-left"
            />
          )}
        />
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => {
            const isLegacy =
              !!item.platform &&
              !platformsForCombobox.supportedPlatforms.some(
                (p) => p.name === item.platform
              ) &&
              platformsForCombobox.otherPlatforms.some(
                (p) => p.name === `${item.platform} (legacy)`
              );
            const displayValue =
              isLegacy && field.value === item.platform
                ? `${item.platform} (legacy)`
                : (field.value ?? "");
            return (
              <PlatformCombobox
                field={{
                  ...field,
                  value: displayValue,
                  onChange: (next: string) => {
                    if (next.endsWith(" (legacy)")) {
                      field.onChange(item.platform);
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
            {isSubmitting ? "Updating..." : "Update Entry"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
