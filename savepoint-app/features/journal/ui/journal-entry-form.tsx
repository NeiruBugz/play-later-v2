"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/shared/components/ui/button";
import { Form, FormField } from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { MAX_CHARACTERS } from "@/shared/lib/rich-text";
import { cn } from "@/shared/lib/ui/utils";
import { type JournalEntryDomain } from "@/shared/types";

import {
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
} from "../schemas";
import { createJournalEntryAction } from "../server-actions/create-journal-entry";
import { getLibraryItemsByGameIdAction } from "../server-actions/get-library-items-by-game-id";
import { updateJournalEntryAction } from "../server-actions/update-journal-entry";

// Use a common form shape that works for both create and update
// We'll validate and transform in handleSubmit
type FormData = {
  title?: string;
  content: string;
  playSession?: number;
  libraryItemId?: number;
};

interface JournalEntryFormProps {
  gameId?: string;
  entry?: JournalEntryDomain;
  onSuccess: (entry: JournalEntryDomain) => void;
  onCancel?: () => void;
  className?: string;
}

export function JournalEntryForm({
  gameId: initialGameId,
  entry,
  onSuccess,
  onCancel,
  className,
}: JournalEntryFormProps) {
  const [libraryItems, setLibraryItems] = useState<
    Array<{ id: number; platform: string | null }>
  >([]);
  const [isLoadingLibraryItems, setIsLoadingLibraryItems] = useState(false);

  const isEditMode = !!entry;
  const gameId = initialGameId ?? entry?.gameId;

  const form = useForm<FormData>({
    resolver: zodResolver(
      z.object({
        title: z.string().optional(),
        content: z
          .string()
          .min(1, "Content is required")
          .max(
            MAX_CHARACTERS,
            `Content must not exceed ${MAX_CHARACTERS} characters`
          ),
        playSession: z.number().int().positive().optional(),
        libraryItemId: z.number().int().positive().optional(),
      })
    ),
    defaultValues: {
      title: entry?.title ?? "",
      content: entry?.content ?? "",
      playSession: entry?.playSession ?? undefined,
      libraryItemId: entry?.libraryItemId ?? undefined,
    },
  });

  // Fetch library items when component mounts or gameId changes
  useEffect(() => {
    if (!gameId) {
      setLibraryItems([]);
      return;
    }

    setIsLoadingLibraryItems(true);
    getLibraryItemsByGameIdAction({ gameId })
      .then((result) => {
        if (result.success) {
          const items = result.data.map((item) => ({
            id: item.id,
            platform: item.platform ?? null,
          }));
          setLibraryItems(items);

          // Auto-link if exactly one library item exists (only in create mode)
          if (items.length === 1 && !isEditMode) {
            form.setValue("libraryItemId", items[0]!.id);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to fetch library items:", error);
      })
      .finally(() => {
        setIsLoadingLibraryItems(false);
      });
  }, [gameId, isEditMode, form]);

  const createAction = useFormSubmission({
    action: createJournalEntryAction,
    successMessage: "Journal entry created",
    successDescription: "Your journal entry has been created.",
    errorMessage: "Failed to create entry",
    onSuccess,
  });

  const updateAction = useFormSubmission({
    action: updateJournalEntryAction,
    successMessage: "Journal entry updated",
    successDescription: "Your journal entry has been updated.",
    errorMessage: "Failed to update entry",
    onSuccess,
  });

  if (!gameId) {
    return (
      <div className="text-destructive p-lg border-destructive/20 bg-destructive/5 rounded-lg border">
        <p className="font-medium">Configuration Error</p>
        <p className="text-sm">
          A game ID is required to create a journal entry.
        </p>
      </div>
    );
  }

  const isSubmitting = isEditMode
    ? updateAction.isSubmitting
    : createAction.isSubmitting;

  const handleSubmit = async (data: FormData) => {
    if (isEditMode) {
      // Transform to UpdateJournalEntryInput
      const updateData: UpdateJournalEntryInput = {
        entryId: entry!.id,
        title: data.title || undefined,
        content: data.content,
        playSession: data.playSession ?? undefined,
        libraryItemId: data.libraryItemId ?? undefined,
      };
      await updateAction.handleSubmit(updateData);
    } else {
      // Transform to CreateJournalEntryInput
      const createData: CreateJournalEntryInput = {
        gameId,
        title: data.title || undefined,
        content: data.content,
        playSession: data.playSession,
        libraryItemId: data.libraryItemId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      await createAction.handleSubmit(createData);
    }
  };
  const showLibraryItemSelector =
    libraryItems.length > 1 || (isEditMode && libraryItems.length > 0);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-xl", className)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <div className="space-y-md">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Add a title (optional)"
                disabled={isSubmitting}
                aria-invalid={!!form.formState.errors.title}
                aria-describedby={
                  form.formState.errors.title ? "title-error" : undefined
                }
                {...field}
              />
              {form.formState.errors.title && (
                <p
                  id="title-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <div className="space-y-md">
              <Label htmlFor="content">What's on your mind?</Label>
              <Textarea
                id="content"
                {...field}
                placeholder="Share your thoughts about this game..."
                className="min-h-[120px] resize-y"
                disabled={isSubmitting}
                aria-invalid={!!form.formState.errors.content}
                aria-describedby={
                  form.formState.errors.content ? "content-error" : undefined
                }
              />
              <p className="text-muted-foreground text-xs">
                {field.value.length}/{MAX_CHARACTERS} characters
              </p>
              {form.formState.errors.content && (
                <p
                  id="content-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="playSession"
          render={({ field }) => (
            <div className="space-y-md">
              <Label htmlFor="playSession">Hours Played (Optional)</Label>
              <Input
                id="playSession"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                disabled={isSubmitting}
                aria-invalid={!!form.formState.errors.playSession}
                aria-describedby={
                  form.formState.errors.playSession
                    ? "playSession-error"
                    : undefined
                }
                {...field}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : Number(value));
                }}
                value={field.value ?? ""}
              />
              {form.formState.errors.playSession && (
                <p
                  id="playSession-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {form.formState.errors.playSession.message}
                </p>
              )}
            </div>
          )}
        />

        {showLibraryItemSelector && (
          <FormField
            control={form.control}
            name="libraryItemId"
            render={({ field }) => (
              <div className="space-y-md">
                <Label htmlFor="libraryItemId">
                  Link to Library Item (Optional)
                </Label>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? undefined : Number(value))
                  }
                  value={
                    field.value
                      ? String(field.value)
                      : libraryItems.length === 1 && !isEditMode
                        ? String(libraryItems[0]!.id)
                        : "none"
                  }
                  disabled={isSubmitting || isLoadingLibraryItems}
                >
                  <SelectTrigger
                    id="libraryItemId"
                    aria-invalid={!!form.formState.errors.libraryItemId}
                  >
                    <SelectValue placeholder="Select library item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {libraryItems.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.platform
                          ? `${item.platform}`
                          : `Item #${item.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {libraryItems.length === 1 && !isEditMode && (
                  <p className="text-muted-foreground text-sm">
                    Automatically linked to your library item
                  </p>
                )}
                {form.formState.errors.libraryItemId && (
                  <p className="text-destructive text-sm" role="alert">
                    {form.formState.errors.libraryItemId.message}
                  </p>
                )}
              </div>
            )}
          />
        )}

        <div className="gap-md pt-lg flex items-center justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save thought"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
