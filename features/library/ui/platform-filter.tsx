"use client"

import { GamePlatform } from "@prisma/client"
import { SelectContent, SelectItem, SelectValue } from "@radix-ui/react-select"

import { Select, SelectTrigger } from "@/components/ui/select"

export function PlatformFilter() {
  return (
    <Select>
      <SelectTrigger className="max-w-[260px]">
        <SelectValue placeholder="Filter by platform" defaultValue="" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(GamePlatform).map(([key, value]) => (
          <SelectItem key={key} value={key} className="normal-case">
            {value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
