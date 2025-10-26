"use client";

import {
  ACQUISITION_TYPES,
  DEFAULT_ACQUISITION_TYPE,
  LIBRARY_ITEM_STATUS,
} from "@/data-access-layer/domain/enums";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
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
import { createLogger } from "@/shared/lib/app/logger";
import { buildIgdbImageUrl } from "@/shared/lib/igdb/igdb-image-utils";
import {
  AcquisitionTypeMapper,
  createSelectOptionsFromEnum,
  LibraryStatusMapper,
} from "@/shared/lib/ui";

import { platformOptions } from "../lib/constants";
import { AddGameFormProps } from "../lib/types";
import {
  AddGameToLibrarySchema,
  type AddGameToLibraryFormValues,
  type AddGameToLibraryInput,
} from "../lib/validation";
import { addGameToLibraryAction } from "../server-actions/add-game-to-library";

const logger = createLogger({ component: "AddGameForm" });

export function AddGameForm({ game, onCancel }: AddGameFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusOptions = createSelectOptionsFromEnum(
    LIBRARY_ITEM_STATUS,
    LibraryStatusMapper
  );
  const acquisitionOptions = createSelectOptionsFromEnum(
    ACQUISITION_TYPES,
    AcquisitionTypeMapper
  );
  const defaultStatus: AddGameToLibraryFormValues["status"] =
    statusOptions[0]?.value ?? "CURIOUS_ABOUT";
  const fallbackAcquisitionType =
    acquisitionOptions[0]?.value ?? DEFAULT_ACQUISITION_TYPE;
  const defaultAcquisitionType: AddGameToLibraryFormValues["acquisitionType"] =
    ACQUISITION_TYPES.includes(DEFAULT_ACQUISITION_TYPE)
      ? DEFAULT_ACQUISITION_TYPE
      : fallbackAcquisitionType;

  const form = useForm<
    AddGameToLibraryFormValues,
    undefined,
    AddGameToLibraryInput
  >({
    resolver: zodResolver(AddGameToLibrarySchema),
    defaultValues: {
      igdbId: game.id,
      status: defaultStatus,
      acquisitionType: defaultAcquisitionType,
    },
  });

  const onSubmit = async (data: AddGameToLibraryInput) => {
    setIsSubmitting(true);

    try {
      const result = await addGameToLibraryAction({
        igdbId: data.igdbId,
        status: data.status,
        platform: data.platform,
        acquisitionType: data.acquisitionType,
      });

      if (result.success) {
        toast.success("Game added to library successfully!");
        router.push("/library");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      logger.error(error, "An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const coverUrl = game.cover?.image_id
    ? buildIgdbImageUrl(game.cover.image_id, "c-big")
    : null;

  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString()
    : "Release date unknown";

  const platforms = game.platforms?.slice(0, 5).map((p) => p.name);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Add {game.name} to Library</CardTitle>
            <CardDescription>
              Configure how you want to track this game in your library
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Change Game
          </Button>
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="bg-muted flex gap-4 rounded-lg p-4">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={`${game.name} cover`}
                  width={64}
                  height={80}
                  className="h-32 w-24 rounded object-cover"
                />
              ) : (
                <div className="bg-muted-foreground/20 flex h-32 w-24 items-center justify-center rounded">
                  <span className="text-muted-foreground text-xs">
                    No image
                  </span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold">{game.name}</h3>
                <p className="text-muted-foreground text-sm">{releaseDate}</p>
                {platforms && platforms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {platforms.map((platform, index) => (
                      <span
                        key={index}
                        className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {platformOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acquisitionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acquisition Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select acquisition type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {acquisitionOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Library"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
