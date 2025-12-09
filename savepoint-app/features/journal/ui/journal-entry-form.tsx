"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { RichTextEditor } from "@/shared/components/rich-text-editor";
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
import { useFormSubmission } from "@/shared/hooks/use-form-submission";
import { cn } from "@/shared/lib/ui/utils";
import { JournalMood, type JournalEntryDomain } from "@/shared/types";

import {
  CreateJournalEntrySchema,
  UpdateJournalEntrySchema,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
} from "../schemas";
import { createJournalEntryAction } from "../server-actions/create-journal-entry";
import { getLibraryItemsByGameIdAction } from "../server-actions/get-library-items-by-game-id";
import { updateJournalEntryAction } from "../server-actions/update-journal-entry";

interface JournalEntryFormProps {
  gameId?: string;
  entry?: JournalEntryDomain;
  onSuccess: () => void;
  onCancel?: () => void;
  className?: string;
}

const MOOD_OPTIONS = [
  { value: JournalMood.EXCITED, label: "Excited" },
  { value: JournalMood.RELAXED, label: "Relaxed" },
  { value: JournalMood.FRUSTRATED, label: "Frustrated" },
  { value: JournalMood.ACCOMPLISHED, label: "Accomplished" },
  { value: JournalMood.CURIOUS, label: "Curious" },
  { value: JournalMood.NOSTALGIC, label: "Nostalgic" },
];

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

  if (!gameId) {
    throw new Error("gameId is required for JournalEntryForm");
  }

  // Use a common form shape that works for both create and update
  // We'll validate and transform in handleSubmit
  type FormData = {
    title: string;
    content: string;
    mood?: JournalMood;
    playSession?: number;
    libraryItemId?: number;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(
      z.object({
        title: z.string().min(1, "Title is required"),
        content: z.string().min(1, "Content is required"),
        mood: z.nativeEnum(JournalMood).optional(),
        playSession: z.number().int().positive().optional(),
        libraryItemId: z.number().int().positive().optional(),
      })
    ),
    defaultValues: {
      title: entry?.title ?? "",
      content: entry?.content ?? "",
      mood: entry?.mood ?? undefined,
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

  const isSubmitting = isEditMode
    ? updateAction.isSubmitting
    : createAction.isSubmitting;

  const handleSubmit = async (data: FormData) => {
    if (isEditMode) {
      // Transform to UpdateJournalEntryInput
      const updateData: UpdateJournalEntryInput = {
        entryId: entry!.id,
        title: data.title,
        content: data.content,
        mood: data.mood ?? undefined,
        playSession: data.playSession ?? undefined,
        libraryItemId: data.libraryItemId ?? undefined,
      };
      await updateAction.handleSubmit(updateData);
    } else {
      // Transform to CreateJournalEntryInput
      const createData: CreateJournalEntryInput = {
        gameId,
        title: data.title,
        content: data.content,
        mood: data.mood,
        playSession: data.playSession,
        libraryItemId: data.libraryItemId,
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
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Enter entry title"
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
              <Label htmlFor="content">
                Content <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Write your journal entry..."
                disabled={isSubmitting}
              />
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
          name="mood"
          render={({ field }) => (
            <div className="space-y-md">
              <Label htmlFor="mood">Mood (Optional)</Label>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : value)
                }
                value={field.value ?? "none"}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="mood"
                  aria-invalid={!!form.formState.errors.mood}
                >
                  <SelectValue placeholder="Select a mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {MOOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.mood && (
                <p className="text-destructive text-sm" role="alert">
                  {form.formState.errors.mood.message}
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
                step="0.5"
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
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
                ? "Save Changes"
                : "Create Entry"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
