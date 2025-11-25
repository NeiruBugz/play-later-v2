import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { DialogFooter } from "@/shared/components/ui/dialog";
import { Form, FormField } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { getStatusLabel } from "@/shared/lib/library-status";

import {
  UpdateLibraryEntrySchema,
  type UpdateLibraryEntryInput,
} from "../../schemas";
import { updateLibraryEntryAction } from "../../server-actions";
import { DateField } from "./date-field";
import type { EditEntryFormProps } from "./edit-entry-form.types";
import { LibraryEntryMetadata } from "./library-entry-metadata";
import { StatusSelect } from "./status-select";

export const EditEntryForm = ({
  item,
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
    },
  });
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
        <div className="space-y-md">
          <Label htmlFor="platform-readonly">Platform</Label>
          <Input
            id="platform-readonly"
            value={item.platform ?? "Not specified"}
            disabled
            className="bg-muted cursor-not-allowed"
            aria-readonly="true"
          />
          <p className="text-muted-foreground text-sm">
            Platform cannot be changed. Create a new entry for a different
            platform.
          </p>
        </div>
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
