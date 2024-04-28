"use client";

import type { SearchResponse } from "@/src/packages/types/igdb";

import { saveGameToLibrary } from "@/src/actions/library/save-to-library";
import { PickerPopover } from "@/src/components/shared/add-game/form/picker-popover";
import { SelectedGame } from "@/src/components/shared/add-game/form/selected-game";
import { useToastHandler } from "@/src/components/shared/add-game/form/use-toast-handler";
import {
  AddGameSchema,
  addGameSchema,
} from "@/src/components/shared/add-game/form/validation";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/src/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PurchaseTypeToFormLabel, cn, mapStatusForInfo } from "@/src/packages/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { GameStatus, PurchaseType } from "@prisma/client";
import { nanoid } from "nanoid";
import React from "react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";

import { FormDescription } from "./description";

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
  const toastHandler = useToastHandler();
  const isWishlisted = form.watch("isWishlist");

  const [selectedGame, setSelectedGame] = React.useState<
    SearchResponse | undefined
  >(undefined);

  const onGameSelect = React.useCallback(
    (game: SearchResponse) => {
      form.setValue("title", game.name);
      setSelectedGame(game);
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
        toastHandler("success", title);
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
        toastHandler("success", title);
      }
    } catch (error) {
      console.error("Error:", error);
      toastHandler("error", values.title);
      return null;
    } finally {
      form.reset();
      setSelectedGame(undefined);
    }
  };

  return (
    <div className={cn("my-6", { "m-0": isCompact })}>
      <PickerPopover onGameSelect={onGameSelect} selectedGame={selectedGame} />
      <SelectedGame selectedGame={selectedGame} />
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
            <FaSpinner
              className={cn("mr-2 animate-spin", {
                hidden: !form.formState.isSubmitting,
              })}
            />
            {submitLabel}
          </Button>
          <FormDescription className={cn({ hidden: !withDescription })} />
        </form>
      </Form>
    </div>
  );
}
