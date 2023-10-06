import React from "react"
import { addGame } from "@/features/library/actions"
import { GamePicker } from "@/features/library/ui/add-game/game-picker"
import { zodResolver } from "@hookform/resolvers/zod"
import { GamePlatform, GameStatus, PurchaseType } from "@prisma/client"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover"
import { SelectValue } from "@radix-ui/react-select"
import { HowLongToBeatEntry } from "howlongtobeat"
import { nanoid } from "nanoid"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { cn, uppercaseToNormal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const addGameSchema = z.object({
  platform: z.enum(["PC", "XBOX", "PLAYSTATION", "NINTENDO"]),
  status: z.enum(["BACKLOG", "INPROGRESS", "COMPLETED", "ABANDONED"]),
  title: z.string().min(1),
  purchaseType: z.enum(["PHYSICAL", "DIGITAL"]),
})

export function AddForm({
  afterSubmit,
}: {
  afterSubmit: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const form = useForm<z.infer<typeof addGameSchema>>({
    resolver: zodResolver(addGameSchema),
  })

  const [selectedGame, setSelectedGame] = React.useState<
    HowLongToBeatEntry | undefined
  >(undefined)
  const [isPickerOpen, setPickerOpen] = React.useState(false)

  const onGameSelect = React.useCallback(
    (game: HowLongToBeatEntry) => {
      form.setValue("title", game.name)
      setSelectedGame(game)
      setPickerOpen(false)
    },
    [form]
  )

  const onSubmit = async (values: z.infer<typeof addGameSchema>) => {
    if (!selectedGame) {
      return
    }
    try {
      const { platform, purchaseType, status, title } = values
      const { id, imageUrl } = selectedGame
      await addGame({
        howLongToBeatId: id,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl,
        platform,
        status,
        title,
        purchaseType,
        rating: null,
        review: null,
        deletedAt: null,
      })
      form.reset()
      afterSubmit(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="my-6">
      <Popover modal onOpenChange={setPickerOpen} open={isPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full">
            Find a game
          </Button>
        </PopoverTrigger>
        <PopoverContent className="z-[1000] w-full bg-white shadow-md">
          <GamePicker
            onGameSelect={onGameSelect}
            selectedGame={selectedGame?.id}
          />
        </PopoverContent>
      </Popover>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Title</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value}
                    onChange={field.onChange}
                    disabled
                  />
                </FormControl>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(GameStatus).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span className="normal-case">
                          {uppercaseToNormal(value)}
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
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}
