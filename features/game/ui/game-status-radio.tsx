"use client"

import { useCallback } from "react"
import { updateStatus } from "@/features/library/actions"
import { GameStatus } from "@prisma/client"
import { Ghost, Library, ListChecks, Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RenderWhen } from "@/components/render-when"

export function GameStatusRadio({
  gameStatus,
  gameId,
}: {
  gameId: string
  gameStatus?: GameStatus
}) {
  const onUpdate = useCallback(
    async (newStatus: string) => {
      try {
        await updateStatus(gameId, newStatus as GameStatus)
      } catch (error) {
        console.error(error)
      }
    },
    [gameId]
  )

  return (
    <RadioGroup
      defaultValue={gameStatus}
      value={gameStatus}
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
            value={GameStatus.ABANDONED}
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
  )
}
