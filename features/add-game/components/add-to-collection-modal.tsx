"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AcquisitionType, BacklogItemStatus } from "@prisma/client";
import { ListPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AcquisitionStatusMapper,
  BacklogStatusMapper,
  cn,
  playingOnPlatforms,
} from "@/shared/lib";

import { initialFormValues } from "../lib/constants";
import {
  CreateGameActionSchema,
  type CreateGameActionInput,
} from "../lib/validation";
import { createGameAction } from "../server-actions/create-game-action";

export function AddToCollectionModal({
  gameTitle,
  igdbId,
}: {
  gameTitle: string;
  igdbId: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateGameActionInput>({
    resolver: zodResolver(CreateGameActionSchema),
    defaultValues: {
      ...initialFormValues,
      igdbId,
    },
  });

  const onSubmit = (values: CreateGameActionInput) => {
    startTransition(async () => {
      try {
        const result = await createGameAction(values);

        if (result?.data) {
          toast.success(
            `"${result.data.gameTitle}" has been added to your collection!`
          );
          setOpen(false);
          form.reset({
            ...initialFormValues,
            igdbId,
          });
          router.push(`/game/${result.data.gameId}`);
        } else if (result?.serverError) {
          toast.error(result.serverError);
        } else if (result?.validationErrors) {
          toast.error(
            "Invalid input data. Please check your form and try again."
          );
        }
      } catch (error) {
        console.error("Failed to submit form:", error);
        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  const isLoading = isPending || form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("flex items-center gap-2")}>
          <ListPlus />
          <span>Add to collection</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-1/2 max-w-fit">
        <DialogHeader>
          <DialogTitle>{gameTitle}</DialogTitle>
          <DialogDescription>Add new game to your collection</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col gap-4 py-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4">
                      <FormLabel
                        htmlFor={field.name}
                        className="w-[80px] text-left"
                      >
                        Platform
                      </FormLabel>
                      <Select
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="min-w-[220px]">
                            <SelectValue placeholder="Select a platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {playingOnPlatforms.map((platform) => (
                            <SelectItem
                              value={platform.value}
                              key={platform.value}
                            >
                              {platform.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backlogStatus"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4">
                      <FormLabel
                        htmlFor={field.name}
                        className="w-[80px] text-left"
                      >
                        Status
                      </FormLabel>
                      <Select
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="min-w-[220px]">
                            <SelectValue placeholder="Select a status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(BacklogItemStatus).map((key) => (
                            <SelectItem value={key} key={key}>
                              {BacklogStatusMapper[key as BacklogItemStatus]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acquisitionType"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between gap-4">
                      <FormLabel
                        htmlFor={field.name}
                        className="w-[80px] text-left"
                      >
                        Acquisition
                      </FormLabel>
                      <Select
                        name={field.name}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="min-w-[220px]">
                            <SelectValue placeholder="How did you get it?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.keys(AcquisitionType).map((key) => (
                            <SelectItem value={key} key={key}>
                              {AcquisitionStatusMapper[key as AcquisitionType]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add to Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
