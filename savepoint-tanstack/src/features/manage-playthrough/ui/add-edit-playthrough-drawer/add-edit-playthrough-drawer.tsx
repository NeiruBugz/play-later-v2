import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@tanstack/react-router";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { createPlaythroughFn } from "@/features/manage-playthrough/api/create-playthrough-fn";
import { updatePlaythroughFn } from "@/features/manage-playthrough/api/update-playthrough-fn";
import {
  playthroughFormSchema,
  type PlaythroughFormValues,
} from "@/features/manage-playthrough/model";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RatingInput } from "@/shared/ui/rating-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

import type { AddEditPlaythroughDrawerProps } from "./add-edit-playthrough-drawer.type";

const STATUS_OPTIONS = [
  { value: "PLAYING", label: "Playing" },
  { value: "FINISHED", label: "Finished" },
  { value: "ABANDONED", label: "Abandoned" },
] as const;

const KIND_OPTIONS = [
  { value: "FIRST", label: "First playthrough" },
  { value: "REPLAY", label: "Replay" },
] as const;

function buildDefaultValues(
  existingPlaythroughCount: number,
  prefill?: PlaythroughFormValues
): PlaythroughFormValues {
  if (prefill) return prefill;
  return {
    libraryItemId: 0,
    kind: existingPlaythroughCount === 0 ? "FIRST" : "REPLAY",
    platform: null,
    status: "FINISHED",
    startedAt: null,
    finishedAt: null,
    playtimeHours: 0,
    rating: null,
    completion: null,
    notes: null,
  };
}

export function AddEditPlaythroughDrawer({
  open,
  mode,
  libraryItemId,
  existingPlaythroughCount,
  playthroughId,
  playthrough,
  onOpenChange,
}: AddEditPlaythroughDrawerProps) {
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState } =
    useForm<PlaythroughFormValues>({
      resolver: zodResolver(
        playthroughFormSchema
      ) as Resolver<PlaythroughFormValues>,
      defaultValues: buildDefaultValues(existingPlaythroughCount, playthrough),
    });

  const status = watch("status");
  const kind = watch("kind");
  const rating = watch("rating");
  const isPlaying = status === "PLAYING";

  const onSubmit = async (values: PlaythroughFormValues) => {
    try {
      if (mode === "edit" && playthroughId) {
        await updatePlaythroughFn({
          data: {
            id: playthroughId,
            status: values.status,
            playtimeHours: values.playtimeHours,
            notes: values.notes,
            kind: values.kind,
            platform: values.platform,
            startedAt: values.startedAt,
            finishedAt: values.finishedAt,
            rating: values.rating,
            completion: values.completion,
          },
        });
      } else {
        await createPlaythroughFn({
          data: {
            libraryItemId,
            status: values.status,
            playtimeHours: values.playtimeHours,
            notes: values.notes,
            kind: values.kind,
            platform: values.platform,
            startedAt: values.startedAt,
            finishedAt: values.finishedAt,
            rating: values.rating,
            completion: values.completion,
          },
        });
      }
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Something went wrong");
      toast.error(message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>
            {mode === "add" ? "New playthrough" : "Edit playthrough"}
          </SheetTitle>
          <SheetDescription>
            {mode === "add"
              ? "Log a new playthrough for this game."
              : "Update the details of your playthrough."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-5 px-6 pb-6"
        >
          {/* Type — native radio group so role="radio" is exposed */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Type</legend>
            <div className="flex gap-4">
              {KIND_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    checked={kind === opt.value}
                    onChange={() => setValue("kind", opt.value)}
                    className="h-4 w-4"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setValue("status", v as PlaythroughFormValues["status"])
              }
            >
              <SelectTrigger id="playthrough-status" aria-label="Status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Started */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-started">Started</Label>
            <Input
              id="playthrough-started"
              type="date"
              aria-label="Started"
              {...register("startedAt")}
            />
          </div>

          {/* Finished */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-finished">Finished</Label>
            <Input
              id="playthrough-finished"
              type="date"
              aria-label="Finished"
              disabled={isPlaying}
              {...register("finishedAt")}
            />
            {isPlaying ? (
              <p className="text-muted-foreground text-xs">Still playing</p>
            ) : null}
          </div>

          {/* Hours */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-hours">Hours</Label>
            <Input
              id="playthrough-hours"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              aria-label="Hours"
              {...register("playtimeHours", { valueAsNumber: true })}
            />
          </div>

          {/* Platform */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-platform">Platform</Label>
            <Input
              id="playthrough-platform"
              type="text"
              aria-label="Platform"
              placeholder="e.g. PC, PlayStation 5"
              {...register("platform")}
            />
          </div>

          {/* Completion */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-completion">Completion</Label>
            <Input
              id="playthrough-completion"
              type="text"
              aria-label="Completion"
              placeholder="e.g. 100%, True ending"
              {...register("completion")}
            />
          </div>

          {/* Rating */}
          <div className="flex flex-col gap-1.5">
            <Label>Rating</Label>
            <RatingInput
              aria-label="Rating"
              readOnly={false}
              value={rating ?? null}
              onChange={(v) => setValue("rating", v)}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="playthrough-notes">Notes</Label>
            <Textarea
              id="playthrough-notes"
              aria-label="Notes"
              placeholder="Anything worth noting about this run…"
              rows={3}
              {...register("notes")}
            />
          </div>

          {formState.errors.root ? (
            <p role="alert" className="text-destructive text-sm">
              {formState.errors.root.message}
            </p>
          ) : null}

          <SheetFooter className="mt-auto pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {mode === "add" ? "Add playthrough" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
