"use client";

import React, { useRef } from "react";
import { FormDescription } from "@/features/library/ui/add-game/form/description";
import {
  addGameSchema,
  type AddGameSchema,
} from "@/features/library/ui/add-game/form/validation";
import { GamePicker } from "@/features/library/ui/add-game/game-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Game, GameStatus, PurchaseType } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";

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

import { cn, mapStatusForInfo, PurchaseTypeToFormLabel } from "@/lib/utils";

import type { SearchResponse } from "@/types/igdb";
import { IMAGE_API, IMAGE_SIZES } from "@/config/site";

export function AddForm({
  game,
  isCompact = false,
  submitLabel = "Submit",
  withDescription = true,
}: {
  game?: string;
  isCompact?: boolean;
  submitLabel?: string;
  withDescription?: boolean;
}) {
  const entry = game ? (JSON.parse(game) as SearchResponse) : undefined;
  const form = useForm<AddGameSchema>({
    resolver: zodResolver(addGameSchema),
    defaultValues: {
      title: entry?.name ?? "",
      purchaseType: "DIGITAL",
      status: "BACKLOG",
    },
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  const [selectedGame, setSelectedGame] = React.useState<
    SearchResponse | undefined
  >(entry);
  const [isPickerOpen, setPickerOpen] = React.useState(false);
  const { mutateAsync } = useMutation({
    mutationKey: ["add-to-library"],
    mutationFn: async (data: Omit<Game, "userId">) => {
      console.log(data);
      await fetch(`/api/library`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });

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
    console.log(selectedGame);
    if (!selectedGame) {
      return;
    }
    try {
      const { platform, purchaseType, status, title, isWishlist } = values;
      const howLongToBeatResponse = await fetch(`/api/hltb-search?q=${title}`);
      const response = await howLongToBeatResponse.json();
      await mutateAsync({
        howLongToBeatId: response.id,
        igdbId: selectedGame.id,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: `${IMAGE_API}/${IMAGE_SIZES["c-big"]}/${selectedGame.cover.image_id}.png`,
        platform: platform || null,
        status,
        title,
        purchaseType: purchaseType ? purchaseType : "DIGITAL",
        gameplayTime: response.gameplayTime,
        isWishlisted: Boolean(isWishlist),
        rating: null,
        review: null,
        deletedAt: null,
        listId: null,
      });
      showToast("success", title);
      // form.reset();
    } catch (e) {
      showToast("error", values.title);
      console.error(e);
      form.reset();
    }
  };

  return (
    <div className={cn("my-6", { "m-0": isCompact })}>
      {isCompact ? null : (
        <Popover modal onOpenChange={setPickerOpen} open={isPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="mb-4 w-full"
              ref={triggerRef}
              disabled={game !== undefined}
            >
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
            name="platform"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your platform" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedGame?.platforms.map((platform) => (
                      <SelectItem key={platform.id} value={platform.name}>
                        <div className="normal-case">{platform.name}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="block">Status</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                  >
                    {Object.keys(GameStatus).map((key) => (
                      <FormItem className="flex items-center space-x-0 space-y-0">
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
                                form.getValues().status === key,
                            }
                          )}
                        >
                          {mapStatusForInfo(key as GameStatus)}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchaseType"
            render={({ field }) => (
              <FormItem className="">
                <FormLabel className="block">Purchase type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                  >
                    {Object.keys(PurchaseType).map((key) => (
                      <FormItem className="flex items-center space-x-0 space-y-0">
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
          <Button type="submit">{submitLabel}</Button>
          {isCompact || !withDescription ? null : <FormDescription />}
        </form>
      </Form>
    </div>
  );
}
