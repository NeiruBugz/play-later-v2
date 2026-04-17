"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { JournalEntryDomain } from "@/features/journal/types";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
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
import { JournalMood } from "@/shared/types/journal";

import type { CreateJournalEntryInput } from "../schemas";
import { createJournalEntryAction } from "../server-actions/create-journal-entry";
import { getLibraryItemsByGameIdAction } from "../server-actions/get-library-items-by-game-id";

const MOOD_OPTIONS: { value: JournalMood; emoji: string; label: string }[] = [
  { value: JournalMood.EXCITED, emoji: "🔥", label: "Hyped" },
  { value: JournalMood.RELAXED, emoji: "😌", label: "Chill" },
  { value: JournalMood.ACCOMPLISHED, emoji: "🏆", label: "Proud" },
  { value: JournalMood.FRUSTRATED, emoji: "😵‍💫", label: "Fried" },
  { value: JournalMood.CURIOUS, emoji: "🔍", label: "Curious" },
  { value: JournalMood.NOSTALGIC, emoji: "🕯️", label: "Nostalgic" },
];

type FormData = {
  title?: string;
  content?: string;
  playedMinutes?: number;
  playSession?: number;
  libraryItemId?: number;
  mood?: JournalMood;
  tagsInput?: string;
};

function parseTags(input: string | undefined): string[] {
  if (!input) return [];
  return Array.from(
    new Set(
      input
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.length <= 30)
    )
  ).slice(0, 10);
}

interface JournalEntryQuickFormProps {
  gameId: string;
  onSuccess: (entry: JournalEntryDomain) => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
  className?: string;
}

export function JournalEntryQuickForm({
  gameId,
  onSuccess,
  onCancel,
  onDirtyChange,
  className,
}: JournalEntryQuickFormProps) {
  const [libraryItems, setLibraryItems] = useState<
    Array<{ id: number; platform: string | null }>
  >([]);
  const [isLoadingLibraryItems, setIsLoadingLibraryItems] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(
      z
        .object({
          title: z.string().optional(),
          content: z
            .string()
            .max(
              MAX_CHARACTERS,
              `Content must not exceed ${MAX_CHARACTERS} characters`
            )
            .optional(),
          playedMinutes: z
            .number()
            .int()
            .positive("Playtime must be a positive number")
            .max(60 * 24 * 7)
            .optional(),
          playSession: z.number().int().positive().optional(),
          libraryItemId: z.number().int().positive().optional(),
          mood: z.enum(JournalMood).optional(),
          tagsInput: z.string().optional(),
        })
        .refine(
          (data) =>
            (data.content?.trim().length ?? 0) > 0 ||
            (data.playedMinutes ?? 0) > 0,
          {
            message: "Log some playtime or jot a thought",
            path: ["content"],
          }
        )
    ),
    defaultValues: {
      title: "",
      content: "",
      playedMinutes: undefined,
      playSession: undefined,
      libraryItemId: undefined,
      mood: undefined,
      tagsInput: "",
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const subscription = form.watch(() => {
      onDirtyChange?.(form.formState.isDirty);
    });
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  useEffect(() => {
    setIsLoadingLibraryItems(true);
    getLibraryItemsByGameIdAction({ gameId })
      .then((result) => {
        if (result.success) {
          const items = result.data.map((item) => ({
            id: item.id,
            platform: item.platform ?? null,
          }));
          setLibraryItems(items);

          if (items.length === 1) {
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
  }, [gameId, form]);

  const createAction = useFormSubmission({
    action: createJournalEntryAction,
    successMessage: "Entry saved",
    successDescription: "Your thought has been captured.",
    errorMessage: "Failed to save entry",
    onSuccess,
  });

  const handleSubmit = async (data: FormData) => {
    const tags = parseTags(data.tagsInput);
    const createData: CreateJournalEntryInput = {
      gameId,
      kind: "QUICK",
      title: data.title || undefined,
      content: data.content?.trim() || "",
      playedMinutes: data.playedMinutes,
      playSession: data.playSession,
      libraryItemId: data.libraryItemId,
      mood: data.mood,
      tags: tags.length > 0 ? tags : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    await createAction.handleSubmit(createData);
  };

  const showLibraryItemSelector = libraryItems.length > 1;
  const contentLength = form.watch("content")?.length ?? 0;
  const playedMinutesValue = form.watch("playedMinutes");
  const canSubmit =
    contentLength > 0 ||
    (playedMinutesValue !== undefined && playedMinutesValue > 0);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-lg", className)}
      >
        <FormField
          control={form.control}
          name="playedMinutes"
          render={({ field }) => (
            <div className="space-y-sm">
              <Label
                htmlFor="playedMinutes"
                className="text-muted-foreground text-sm"
              >
                Playtime (minutes)
              </Label>
              <Input
                id="playedMinutes"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="30"
                disabled={createAction.isSubmitting}
                className="border-muted bg-transparent"
                {...field}
                onChange={(e) => {
                  const value = e.target.value;
                  field.onChange(value === "" ? undefined : Number(value));
                }}
                value={field.value ?? ""}
              />
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <div className="space-y-sm">
              <Textarea
                {...field}
                ref={textareaRef}
                placeholder="Any thoughts? (optional)"
                className={cn(
                  "placeholder:text-muted-foreground min-h-[100px] resize-none border-0 bg-transparent p-0 text-base leading-relaxed focus-visible:ring-0",
                  "transition-all duration-200"
                )}
                disabled={createAction.isSubmitting}
                aria-invalid={!!form.formState.errors.content}
                aria-describedby={
                  form.formState.errors.content ? "content-error" : undefined
                }
              />
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-xs transition-colors duration-200",
                    contentLength > MAX_CHARACTERS * 0.9
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {contentLength}/{MAX_CHARACTERS}
                </p>
                {form.formState.errors.content && (
                  <p
                    id="content-error"
                    className="text-destructive text-xs"
                    role="alert"
                  >
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="mood"
          render={({ field }) => (
            <div className="space-y-sm">
              <Label className="text-muted-foreground text-sm">
                Mood (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((option) => {
                  const selected = field.value === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() =>
                        field.onChange(selected ? undefined : option.value)
                      }
                      disabled={createAction.isSubmitting}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="mr-1" aria-hidden>
                        {option.emoji}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="tagsInput"
          render={({ field }) => (
            <div className="space-y-sm">
              <Label htmlFor="tags" className="text-muted-foreground text-sm">
                Tags (optional, comma-separated)
              </Label>
              <Input
                id="tags"
                placeholder="late-night, co-op, boss-fight"
                disabled={createAction.isSubmitting}
                className="border-muted bg-transparent"
                {...field}
              />
            </div>
          )}
        />

        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                "gap-sm text-muted-foreground flex w-full items-center text-sm transition-colors duration-200",
                "hover:text-foreground"
              )}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  showDetails && "rotate-180"
                )}
              />
              <span>Add details</span>
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="animate-in slide-in-from-top-2 fade-in-0 mt-lg space-y-lg duration-200">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <div className="space-y-sm">
                  <Label htmlFor="title" className="text-muted-foreground">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Give this entry a title (optional)"
                    disabled={createAction.isSubmitting}
                    className="border-muted bg-transparent"
                    {...field}
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="playSession"
              render={({ field }) => (
                <div className="space-y-sm">
                  <Label
                    htmlFor="playSession"
                    className="text-muted-foreground"
                  >
                    Hours played this session
                  </Label>
                  <Input
                    id="playSession"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="0"
                    disabled={createAction.isSubmitting}
                    className="border-muted bg-transparent"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    value={field.value ?? ""}
                  />
                </div>
              )}
            />

            {showLibraryItemSelector && (
              <FormField
                control={form.control}
                name="libraryItemId"
                render={({ field }) => (
                  <div className="space-y-sm">
                    <Label
                      htmlFor="libraryItemId"
                      className="text-muted-foreground"
                    >
                      Link to library entry
                    </Label>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(
                          value === "none" ? undefined : Number(value)
                        )
                      }
                      value={field.value ? String(field.value) : "none"}
                      disabled={
                        createAction.isSubmitting || isLoadingLibraryItems
                      }
                    >
                      <SelectTrigger
                        id="libraryItemId"
                        className="border-muted bg-transparent"
                      >
                        <SelectValue placeholder="Select library entry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {libraryItems.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.platform ?? `Entry #${item.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="gap-md pt-sm border-border/50 flex items-center justify-end border-t">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={createAction.isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={createAction.isSubmitting || !canSubmit}
            className="min-w-[80px]"
          >
            {createAction.isSubmitting ? "Saving..." : "Log it"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
