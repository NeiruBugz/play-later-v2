"use client";

import { useCallback, useId, useState } from "react";
import { updateStatus } from "@/features/library/actions";
import { moveToLibrary } from "@/features/wishlist/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { GamePlatform, GameStatus, PurchaseType } from "@prisma/client";
import {
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { CheckCheck, Ghost, Library, ListChecks, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

import { cn, uppercaseToNormal } from "@/lib/utils";

const moveFromWishlistSchema = z.object({
  platform: z.enum(["PC", "XBOX", "PLAYSTATION", "NINTENDO"]),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL"]),
});

type FormValues = z.infer<typeof moveFromWishlistSchema>;

const statusMapping = {
  [GameStatus.BACKLOG]: {
    icon: <Library className="md:size-4" />,
    radioValue: "backlog",
    tooltipValue: "Move to backlog",
  },
  [GameStatus.INPROGRESS]: {
    icon: <Play className="md:size-4" />,
    radioValue: "inprogress",
    tooltipValue: "Playing",
  },
  [GameStatus.COMPLETED]: {
    icon: <ListChecks className="md:size-4" />,
    radioValue: "complete",
    tooltipValue: "Mark as completed",
  },
  [GameStatus.FULL_COMPLETION]: {
    icon: <CheckCheck className="md:size-4" />,
    radioValue: "fullComplete",
    tooltipValue: "Mark as 100% completed",
  },
  [GameStatus.ABANDONED]: {
    icon: <Ghost className="md:size-4" />,
    radioValue: "abandon",
    tooltipValue: "Abandon game / Pause playing",
  },
};

const MoveFromWishlistDialog = ({
  gameId,
  isDialogOpen,
  onOpenChange,
  updatedStatus,
}: {
  gameId: string;
  isDialogOpen: boolean;
  onOpenChange: (value: boolean) => void;
  updatedStatus?: GameStatus;
}) => {
  const formId = useId();
  const form = useForm<FormValues>({
    resolver: zodResolver(moveFromWishlistSchema),
    defaultValues: {
      platform: "PC",
      purchaseType: "DIGITAL",
    },
  });

  const onSubmit = async (values: FormValues) => {
    const { platform, purchaseType } = values;
    await moveToLibrary(
      gameId,
      platform as GamePlatform,
      purchaseType as PurchaseType,
      updatedStatus as GameStatus
    );
  };

  const onReset = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger className="rounded bg-muted p-2">
        Move from wishlist
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onReset={onReset}
            onSubmit={form.handleSubmit(onSubmit)}
            id={formId}
          >
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
                      {Object.entries(GamePlatform).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <span className="normal-case">
                            {value !== GamePlatform.PC
                              ? uppercaseToNormal(value)
                              : value}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseType"
              render={({ field }) => (
                <FormItem className="space-x-4">
                  <FormLabel>Purchase type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
                    >
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value={PurchaseType.PHYSICAL}
                            id="physical"
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor="physical"
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                            "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            {
                              "bg-background text-foreground shadow-sm":
                                form.getValues().purchaseType ===
                                PurchaseType.PHYSICAL,
                            }
                          )}
                        >
                          Physical
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value={PurchaseType.DIGITAL}
                            id="digital"
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor="digital"
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                            "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            {
                              "bg-background text-foreground shadow-sm":
                                form.getValues().purchaseType ===
                                PurchaseType.DIGITAL,
                            }
                          )}
                        >
                          Digital
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormDescription>
              To move the game from wishlist to library, you need to provide
              platform and purchase type
            </FormDescription>
          </form>
        </Form>
        <DialogFooter>
          <Button type="reset" form={formId} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function GameStatusRadio({
  gameStatus,
  gameId,
}: {
  gameId: string;
  gameStatus?: GameStatus;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [checkedStatus, setCheckedStatus] = useState<GameStatus | undefined>(
    gameStatus
  );

  const onUpdate = useCallback(
    async (newStatus: string) => {
      if (gameStatus === undefined) {
        setCheckedStatus(newStatus as GameStatus);
        setIsOpen(true);
        return;
      }

      try {
        await updateStatus(gameId, newStatus as GameStatus);
      } catch (error) {
        console.error(error);
      }
    },
    [gameId, gameStatus]
  );

  return (
    <>
      {gameStatus ? null : (
        <MoveFromWishlistDialog
          isDialogOpen={isOpen}
          onOpenChange={setIsOpen}
          updatedStatus={checkedStatus}
          gameId={gameId}
        />
      )}
      <RadioGroup
        defaultValue={gameStatus}
        value={gameStatus ?? checkedStatus}
        className={cn(
          "group flex flex-row items-center justify-center rounded-md bg-muted p-1 text-muted-foreground disabled:cursor-not-allowed lg:flex-col"
        )}
        onValueChange={onUpdate}
        disabled={gameStatus === undefined}
      >
        {Object.entries(statusMapping).map(([key, value]) => (
          <div key={key}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <RadioGroupItem
                      value={key}
                      id={value.radioValue}
                      className="group sr-only"
                    />
                    <Label
                      htmlFor={value.radioValue}
                      className={cn(
                        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                        "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:ring-2 group-disabled:cursor-not-allowed group-disabled:hover:ring-0",
                        {
                          "bg-background text-foreground shadow-sm":
                            gameStatus === key,
                        }
                      )}
                    >
                      {value.icon}
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded bg-black p-2 text-xs text-white">
                  {value.tooltipValue}
                  <TooltipArrow />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ))}
      </RadioGroup>
    </>
  );
}
