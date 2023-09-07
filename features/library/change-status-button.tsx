"use client"

import { updateStatus } from "@/data/games"
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
  gameStatus,
  gameId,
  buttonStatus,
}: {
  gameStatus: GameStatus
  gameId: string
  buttonStatus: GameStatus
}) {
  return (
    <Button
      className="h-9 rounded-md px-3 md:h-10 md:px-4 md:py-2"
      disabled={gameStatus === buttonStatus}
      onClick={() => updateStatus(gameId, buttonStatus)}
    >
      {mapStatusToUI(buttonStatus)}
    </Button>
  )
}
