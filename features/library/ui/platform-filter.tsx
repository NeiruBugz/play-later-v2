"use client"

import React from "react"
import { GamePlatform } from "@prisma/client"

import { useSearchParamsMutation } from "@/lib/hooks/useSearchParamsMutation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PlatformFilter() {
  const {
    currentValue,
    handleParamsClear,
    handleParamsDeleteByName,
    handleParamsMutation,
  } = useSearchParamsMutation()
  const defaultValue = currentValue("platform") ?? " "

  React.useEffect(() => {
    if (defaultValue === " ") {
      handleParamsClear()
    }
    return () => {
      handleParamsDeleteByName("platform")
    }
  }, [defaultValue, handleParamsClear, handleParamsDeleteByName])

  const onValueChange = (value: string) => {
    if (value === "all") {
      handleParamsClear()
    }
    handleParamsMutation("platform", value)
  }

  return (
    <Select value={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger className="h-10 min-w-[140px] max-w-[260px]">
        <SelectValue placeholder="Platform filter" defaultValue=" " />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(GamePlatform).map(([key, value]) => (
          <SelectItem key={key} value={key} className="normal-case">
            {value}
          </SelectItem>
        ))}
        <SelectItem value={" "} className="normal-case">
          All
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
