import type { Game } from "@prisma/client"

export interface PickerControlsProps {
  isRunning: boolean
  hasChoice: boolean
  start: () => void
  stop: () => void
}

export interface PickerChoiceProps {
  isRunning: boolean
  choice: Game
  afterClick: () => void
}

export interface PickerProps {
  items: Game[]
  closeDialog: () => void
}
