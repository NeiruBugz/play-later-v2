"use client"

import { useCallback } from "react"
import { updateStatus } from "@/features/library/actions"
import { GameStatus } from "@prisma/client"

import { Button } from "@/components/ui/button"

function mapStatusToUI(value: GameStatus) {
  switch (value) {
    case "BACKLOG":
      return "Put in backlog"
    case "INPROGRESS":
      return "Start playing"
    case "COMPLETED":
      return "Complete"
    case "ABANDONED":
      return "Abandon"
  }
}

export default function ChangeStatusButton({
  buttonStatus,
  gameId,
  gameStatus,
}: {
  gameStatus: GameStatus
  gameId: string
  buttonStatus: GameStatus
}) {
  const onUpdate = useCallback(async () => {
    try {
      await updateStatus(gameId, buttonStatus)
    } catch (error) {
      console.error(error)
    }
  }, [buttonStatus, gameId])

  return (
    <Button
      className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2"
      disabled={gameStatus === buttonStatus}
      onClick={onUpdate}
    >
      {mapStatusToUI(buttonStatus)}
    </Button>
  )
}
