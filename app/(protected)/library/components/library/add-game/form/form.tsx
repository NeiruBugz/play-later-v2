"use client";

import React, { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { GameStatus, PurchaseType } from "@prisma/client";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";
import type { SearchResponse } from "@/lib/types/igdb";
import { cn, mapStatusForInfo, PurchaseTypeToFormLabel } from "@/lib/utils";

import { GamePicker } from "@/app/(protected)/library/components/library/add-game/game-picker";
import { saveGameToLibrary } from "@/app/(protected)/library/lib/actions/save-to-library";

import { FormDescription } from "./description";
import { addGameSchema, type AddGameSchema } from "./validation";

export function AddForm({
  isCompact = false,
  submitLabel = "Submit",
  withDescription = true,
}: {
  isCompact?: boolean;
  submitLabel?: string;
  withDescription?: boolean;
}) {
  const form = useForm<AddGameSchema>({
    resolver: zodResolver(addGameSchema),
    defaultValues: {
      title: "",
      purchaseType: "DIGITAL",
      status: "BACKLOG",
    },
  });
  const { toast } = useToast();
  const isWishlisted = form.watch("isWishlist");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selectedGame, setSelectedGame] = React.useState<
    SearchResponse | undefined
  >(undefined);
  const [isPickerOpen, setPickerOpen] = React.useState(false);

  const showToast = (type: "success" | "error", name: string) => {
    if (type === "success") {
      toast({
        title: "Success",
        description: `${name} was successfully added to your games`,
      });
      return;
    }

    if (type === "error") {
      toast({
        title: "Oops, something happened",
        description: `We couldn't add ${name} to your games`,
        variant: "destructive",
      });
      return;
    }
  };

  const onGameSelect = React.useCallback(
    (game: SearchResponse) => {
      form.setValue("title", game.name);
      setSelectedGame(game);
      setPickerOpen(false);
    },
    [form]
  );

  const onSubmit = async (values: AddGameSchema) => {
    if (!selectedGame) {
      return;
    }
    const { purchaseType, status, title, isWishlist } = values;
    const {
      id: idgbId,
      cover: { image_id },
    } = selectedGame;
    try {
      const howLongToBeatResponse = await fetch(`/api/hltb-search?q=${title}`);
      const gameData = {
        igdbId: idgbId,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: image_id,
        status: status || null,
        title,
        purchaseType: purchaseType ? purchaseType : "DIGITAL",
        isWishlisted: Boolean(isWishlist),
        rating: null,
        review: null,
        deletedAt: null,
      };
      if (howLongToBeatResponse.ok) {
        const response = await howLongToBeatResponse.json();
        const withHLTB = {
          ...gameData,
          ...{
            howLongToBeatId: response.id,
            gameplayTime: response.gameplayTime,
          },
        };
        await saveGameToLibrary(withHLTB);
        showToast("success", title);
        return gameData;
      } else {
        console.error(
          "Error fetching How Long To Beat data:",
          howLongToBeatResponse.statusText
        );
        const withoutHLTB = {
          ...gameData,
          ...{
            howLongToBeatId: undefined,
            gameplayTime: undefined,
          },
        };
        await saveGameToLibrary(withoutHLTB);
        showToast("success", title);
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("error", values.title);
      return null;
    } finally {
      form.reset();
      setSelectedGame(undefined);
    }
  };

  return (
    <div className={cn("my-6", { "m-0": isCompact })}>
      {isCompact ? null : (
        <Popover modal onOpenChange={setPickerOpen} open={isPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="mb-4 w-full" ref={triggerRef}>
              Find a game
            </Button>
          </PopoverTrigger>
          <PopoverContent className="z-[1000] w-full bg-popover shadow-md">
            <GamePicker
              onGameSelect={onGameSelect}
              selectedGame={selectedGame?.id}
              width={triggerRef.current?.getBoundingClientRect().width}
            />
          </PopoverContent>
        </Popover>
      )}
      {!isCompact && selectedGame ? (
        <div className="rounded-md border px-2 py-1 shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Avatar className="rounded-md">
              <AvatarImage
                className="object-center"
                src={`${IMAGE_API}/${IMAGE_SIZES["micro"]}/${selectedGame.cover.image_id}.png`}
                alt={selectedGame.name}
              />
              <AvatarFallback>{selectedGame.name}</AvatarFallback>
            </Avatar>
            {selectedGame.name}
          </div>
        </div>
      ) : null}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("space-y-4 overflow-auto", { hidden: !selectedGame })}
        >
          <FormField
            control={form.control}
            name="isWishlist"
            render={({ field }) => (
              <FormItem className="my-2">
                <FormLabel
                  className="flex items-center gap-2"
                  htmlFor="isWishlist"
                >
                  Is it wishlisted game?
                  <Checkbox
                    id="isWishlist"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            disabled={isWishlisted}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block">Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.keys(GameStatus).map((key) => (
                      <SelectItem key={key} value={key}>
                        <div className="normal-case">
                          {mapStatusForInfo(key as GameStatus)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            disabled={isWishlisted}
            name="purchaseType"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel className="block">Purchase type</FormLabel>
                <FormControl>
                  <RadioGroup
                    disabled={isWishlisted}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                  >
                    {Object.keys(PurchaseType).map((key) => (
                      <FormItem
                        className="flex items-center space-x-0 space-y-0"
                        key={key}
                      >
                        <FormControl key={key}>
                          <RadioGroupItem
                            value={key}
                            id={key}
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor={key}
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                            "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            {
                              "bg-background text-foreground shadow-sm":
                                form.getValues().purchaseType === key,
                            }
                          )}
                        >
                          {PurchaseTypeToFormLabel[key as PurchaseType]}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit">
            {form.formState.isSubmitting ? (
              <FaSpinner className="mr-2 animate-spin" />
            ) : null}
            {submitLabel}
          </Button>
          {isCompact || !withDescription ? null : <FormDescription />}
        </form>
      </Form>
    </div>
  );
}
