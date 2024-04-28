"use client";

import { GamePicker } from "@/app/(protected)/library/components/library/add-game/game-picker";
import { saveGameToLibrary } from "@/app/(protected)/library/lib/actions/save-to-library";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { GameStatus, PurchaseType } from "@prisma/client";
import { nanoid } from "nanoid";
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";
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
    defaultValues: {
      purchaseType: "DIGITAL",
      status: "BACKLOG",
      title: "",
    },
    resolver: zodResolver(addGameSchema),
  });
  const { toast } = useToast();
  const isWishlisted = form.watch("isWishlist");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selectedGame, setSelectedGame] = React.useState<
    SearchResponse | undefined
  >(undefined);
  const [isPickerOpen, setPickerOpen] = React.useState(false);

  const showToast = (type: "error" | "success", name: string) => {
    if (type === "success") {
      toast({
        description: `${name} was successfully added to your games`,
        title: "Success",
      });
      return;
    }

    if (type === "error") {
      toast({
        description: `We couldn't add ${name} to your games`,
        title: "Oops, something happened",
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
    const { isWishlist, purchaseType, status, title } = values;
    const {
      cover: { image_id },
      id: idgbId,
    } = selectedGame;
    try {
      const howLongToBeatResponse = await fetch(`/api/hltb-search?q=${title}`);
      const gameData = {
        createdAt: new Date(),
        deletedAt: null,
        id: nanoid(),
        igdbId: idgbId,
        imageUrl: image_id,
        isWishlisted: Boolean(isWishlist),
        purchaseType: purchaseType ? purchaseType : "DIGITAL",
        rating: null,
        review: null,
        status: status || null,
        title,
        updatedAt: new Date(),
      };
      if (howLongToBeatResponse.ok) {
        const response = await howLongToBeatResponse.json();
        const withHLTB = {
          ...gameData,
          ...{
            gameplayTime: response.gameplayTime,
            howLongToBeatId: response.id,
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
            gameplayTime: undefined,
            howLongToBeatId: undefined,
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
            <Button className="mb-4 w-full" ref={triggerRef} variant="outline">
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
                alt={selectedGame.name}
                className="object-center"
                src={`${IMAGE_API}/${IMAGE_SIZES["micro"]}/${selectedGame.cover.image_id}.png`}
              />
              <AvatarFallback>{selectedGame.name}</AvatarFallback>
            </Avatar>
            {selectedGame.name}
          </div>
        </div>
      ) : null}
      <Form {...form}>
        <form
          className={cn("space-y-4 overflow-auto", { hidden: !selectedGame })}
          onSubmit={form.handleSubmit(onSubmit)}
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
                    checked={field.value}
                    id="isWishlist"
                    onCheckedChange={field.onChange}
                  />
                </FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            disabled={isWishlisted}
            name="status"
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
                    className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                    defaultValue={field.value}
                    disabled={isWishlisted}
                    onValueChange={field.onChange}
                  >
                    {Object.keys(PurchaseType).map((key) => (
                      <FormItem
                        className="flex items-center space-x-0 space-y-0"
                        key={key}
                      >
                        <FormControl key={key}>
                          <RadioGroupItem
                            className="sr-only"
                            id={key}
                            value={key}
                          />
                        </FormControl>
                        <FormLabel
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                            "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            {
                              "bg-background text-foreground shadow-sm":
                                form.getValues().purchaseType === key,
                            }
                          )}
                          htmlFor={key}
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
