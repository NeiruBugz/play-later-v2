"use client"

import { useCallback, useId, useState } from "react"
import { updateStatus } from "@/features/library/actions"
import { moveToLibrary } from "@/features/wishlist/actions"
import { zodResolver } from "@hookform/resolvers/zod"
import { GamePlatform, GameStatus, PurchaseType } from "@prisma/client"
import { Ghost, Library, ListChecks, Play } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn, uppercaseToNormal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RenderWhen } from "@/components/render-when"

const moveFromWishlistSchema = z.object({
  platform: z.enum(["PC", "XBOX", "PLAYSTATION", "NINTENDO"]),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL"]),
})

type FormValues = z.infer<typeof moveFromWishlistSchema>

const MoveFromWishlistDialog = ({
  gameId,
  isDialogOpen,
  onOpenChange,
  updatedStatus,
}: {
  gameId: string
  isDialogOpen: boolean
  onOpenChange: (value: boolean) => void
  updatedStatus?: GameStatus
}) => {
  const formId = useId()
  const form = useForm<FormValues>({
    resolver: zodResolver(moveFromWishlistSchema),
    defaultValues: {
      platform: "PC",
      purchaseType: "DIGITAL",
    },
  })

  const onSubmit = async (values: FormValues) => {
    const { platform, purchaseType } = values
    await moveToLibrary(
      gameId,
      platform as GamePlatform,
      purchaseType as PurchaseType,
      updatedStatus as GameStatus
    )
  }

  const onReset = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger />
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
  )
}

export function GameStatusRadio({
  gameStatus,
  gameId,
}: {
  gameId: string
  gameStatus?: GameStatus
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [checkedStatus, setCheckedStatus] = useState<GameStatus | undefined>(
    gameStatus
  )

  const onUpdate = useCallback(
    async (newStatus: string) => {
      if (gameStatus === undefined) {
        setCheckedStatus(newStatus as GameStatus)
        setIsOpen(true)
        return
      }

      try {
        await updateStatus(gameId, newStatus as GameStatus)
      } catch (error) {
        console.error(error)
      }
    },
    [gameId, gameStatus]
  )

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
        className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground"
        onValueChange={onUpdate}
      >
        <div className="flex items-center">
          <RadioGroupItem
            value={GameStatus.BACKLOG}
            id="r1"
            className="group sr-only"
          />
          <Label
            htmlFor="r1"
            className={cn(
              "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
              "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              {
                "bg-background text-foreground shadow-sm":
                  gameStatus === GameStatus.BACKLOG,
              }
            )}
          >
            <Library className="md:mr-1 md:h-4 md:w-4" />
            &nbsp;
            <span className="hidden md:block">Put in backlog</span>
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value={GameStatus.INPROGRESS}
            id="r2"
            className="group sr-only"
          />
          <Label
            htmlFor="r2"
            className={cn(
              "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
              "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              {
                "bg-background text-foreground shadow-sm":
                  gameStatus === GameStatus.INPROGRESS,
              }
            )}
          >
            <>
              <Play className="md:mr-1 md:h-4 md:w-4" />
              <span className="hidden md:block">Start playing</span>
            </>
          </Label>
        </div>
        <RenderWhen condition={Boolean(gameStatus)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={GameStatus.COMPLETED}
              id="r3"
              className="group sr-only"
            />
            <Label
              htmlFor="r3"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                  "bg-background text-foreground shadow-sm":
                    gameStatus === GameStatus.COMPLETED,
                }
              )}
            >
              <>
                <ListChecks className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">Complete</span>
              </>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={GameStatus.FULL_COMPLETION}
              id="r4"
              className="group sr-only"
            />
            <Label
              htmlFor="r4"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                  "bg-background text-foreground shadow-sm":
                    gameStatus === GameStatus.FULL_COMPLETION,
                }
              )}
            >
              <>
                <ListChecks className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">100% Completion</span>
              </>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={GameStatus.ABANDONED}
              id="r5"
              className="group sr-only"
            />
            <Label
              htmlFor="r5"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3",
                "py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                {
                  "bg-background text-foreground shadow-sm":
                    gameStatus === GameStatus.ABANDONED,
                }
              )}
            >
              <>
                <Ghost className="md:mr-1 md:h-4 md:w-4" />
                <span className="hidden md:block">Abandon</span>
              </>
            </Label>
          </div>
        </RenderWhen>
      </RadioGroup>
    </>
  )
}
