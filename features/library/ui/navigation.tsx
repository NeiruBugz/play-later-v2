"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GameStatus } from "@prisma/client"

import { useSearchParamsMutation } from "@/lib/hooks/useSearchParamsMutation"
import { cn, mapStatusToUI, StatusToUIMapping } from "@/lib/utils"

function LibraryNavigation() {
  const { currentValue, handleParamsMutation } = useSearchParamsMutation()

  useEffect(() => {
    if (!currentValue("status")) {
      handleParamsMutation("status", GameStatus.BACKLOG as string)
    }
  }, [currentValue, handleParamsMutation])

  return (
    <ul className="flex py-2">
      {Object.entries(GameStatus).map(([key, value]) => {
        return (
          <li
            key={key}
            className={cn(
              "cursor-pointer border-b border-transparent p-2 transition-all duration-300 hover:border-b hover:border-secondary first-of-type:pl-0",
              {
                "border-primary": currentValue("status") === value,
              }
            )}
            onClick={() => handleParamsMutation("status", value as string)}
          >
            {StatusToUIMapping[value]}
          </li>
        )
      })}
    </ul>
  )
}

export { LibraryNavigation }
