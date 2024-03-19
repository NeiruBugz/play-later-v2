"use client"

import { memo, useCallback, useEffect, useRef, useState, type FC } from "react"
import { updateStatus } from "@/features/library/actions"
import { type Game } from "@prisma/client"

import { getRandomItem, platformEnumToColor } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge, ColorVariant } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PickerControlsProps {
  isRunning: boolean
  hasChoice: boolean
  start: () => void
  stop: () => void
}

interface PickerChoiceProps {
  isRunning: boolean
  choice: Game
  afterClick: () => void
}

interface PickerProps {
  items: Game[]
  closeDialog: () => void
}

function PickerChoice({ choice, isRunning, afterClick }: PickerChoiceProps) {
  const onClick = async () => {
    if (isRunning) {
      return
    }

    try {
      await updateStatus(choice.id, "INPROGRESS")
      afterClick()
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <div
      className="my-4 flex cursor-pointer flex-col items-center justify-center gap-4 border border-transparent p-4 hover:rounded-md hover:border hover:border-primary md:flex-row"
      onClick={onClick}
    >
      {!isRunning ? (
        <Avatar className="size-fit rounded-md">
          <AvatarImage
            className="size-20 object-cover"
            src={choice.imageUrl}
            alt={choice.title}
            width={128}
            height={128}
          />
          <AvatarFallback>{choice.title}</AvatarFallback>
        </Avatar>
      ) : null}
      <p className="text-xl font-bold">{choice.title}</p>
      {!isRunning ? (
        <Badge
          variant={
            platformEnumToColor(choice!.platform as string) as ColorVariant
          }
        >
          {choice.platform}
        </Badge>
      ) : null}
    </div>
  )
}

const MemoizedChoice = memo(PickerChoice)

const PickerControls: FC<PickerControlsProps> = ({
  isRunning,
  hasChoice,
  start,
  stop,
}) => (
  <div className="mt-4 flex gap-4">
    <Button onClick={start} disabled={isRunning || !hasChoice}>
      Start
    </Button>
    <Button onClick={stop} disabled={!isRunning} variant="secondary">
      Stop
    </Button>
  </div>
)

const MemoizedControls = memo(PickerControls)

function Picker({ items, closeDialog }: PickerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentChoice, setCurrentChoice] = useState<Game>(
    getRandomItem(items) ?? items[0]
  )

  const intervalRef = useRef<number | null>(null)
  const intervalDuration = useRef(75)
  const duration = useRef(1000)

  const start = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = window.setInterval(
      setChoice,
      intervalDuration.current
    )
    setIsRunning(true)

    setTimeout(() => {
      if (isRunning) {
        stop()
      }
    }, duration.current)
  }

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }
    setIsRunning(false)
    setCurrentChoice(getRandomItem(items) ?? items[0])
  }, [items])

  const pickChoice = useCallback(() => {
    return getRandomItem(items) ?? items[0]
  }, [items])

  const setChoice = useCallback(() => {
    setCurrentChoice(pickChoice())
  }, [pickChoice])

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      <MemoizedChoice
        choice={currentChoice}
        isRunning={isRunning}
        afterClick={closeDialog}
      />
      <MemoizedControls
        isRunning={isRunning}
        hasChoice={currentChoice !== undefined}
        start={start}
        stop={stop}
      />
    </div>
  )
}

export { Picker }
