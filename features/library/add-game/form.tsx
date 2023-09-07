import React from "react"
import { addGame } from "@/data/games"
import { GamePicker } from "@/features/library/add-game/game-picker"
import { zodResolver } from "@hookform/resolvers/zod"
import { GamePlatform, GameStatus } from "@prisma/client"
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

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const addGameSchema = z.object({
  title: z.string().min(1),
  platform: z.enum(["PC", "XBOX", "PLAYSTATION", "NINTENDO"]),
  status: z.enum(["BACKLOG", "INPROGRESS", "COMPLETED", "ABANDONED"]),
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
      await addGame({
        title: values.title,
        status: values.status,
        platform: values.platform,
        imageUrl: selectedGame.imageUrl,
        howLongToBeatId: selectedGame.id,
        id: nanoid(),
        rating: null,
        review: null,
        createdAt: new Date(),
        updatedAt: new Date(),
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
          <GamePicker onGameSelect={onGameSelect} />
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
                        <span className="normal-case">{value}</span>
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
                        <span className="normal-case">{value}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </div>
  )
}
