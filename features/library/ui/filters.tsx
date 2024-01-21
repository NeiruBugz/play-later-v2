"use client"

import { useEffect, useMemo, type JSX, type ReactNode } from "react"
import { PlatformFilter } from "@/features/library/ui/platform-filter"
import { ArrowDown, ArrowUp } from "lucide-react"

import { useSearchParamsMutation } from "@/lib/hooks/useSearchParamsMutation"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DefaultSortState = {
  order: "desc",
  sortBy: "updatedAt",
}

const sortingFields = ["updatedAt", "gameplayTime", "createdAt"]

const mapper = {
  updatedAt: "Updated",
  gameplayTime: "Time to beat the story",
  createdAt: "Creation date",
}

function LibraryFilters() {
  const { currentValue, handleParamsMutation, handleMultipleParamsMutation } =
    useSearchParamsMutation()
  useEffect(() => {
    const sortOrder = currentValue("order")
    const sortField = currentValue("sortBy")

    if (!sortOrder) {
      handleParamsMutation("order", DefaultSortState.order)
    }

    if (!sortField) {
      handleParamsMutation("sortBy", DefaultSortState.sortBy)
    }
  }, [currentValue, handleParamsMutation])

  const onSortingSelect = (value: string) => {
    const [field, order] = value.split("-")
    handleMultipleParamsMutation([{ sortBy: field }, { order }])
  }

  const options = useMemo(() => {
    const options: Array<{ value: string; label: ReactNode }> = []
    sortingFields.forEach((value) => {
      options.push({
        value: `${value}-asc`,
        label: (
          <div className="flex h-6 items-center gap-4 ">
            {mapper[value as keyof typeof mapper]} <ArrowUp size={20} />
          </div>
        ),
      })
      options.push({
        value: `${value}-desc`,
        label: (
          <div className="flex h-6 items-center gap-4">
            {mapper[value as keyof typeof mapper]} <ArrowDown size={20} />
          </div>
        ),
      })
    })

    return options
  }, [])

  return (
    <>
      <h3 className="mb-2 text-xl font-bold">Filters</h3>
      <section className="flex gap-2">
        <Select
          value={`${currentValue("sortBy")}-${currentValue("order")}`}
          onValueChange={onSortingSelect}
        >
          <div>
            <Label className="my-2 block">Sort</Label>
            <SelectTrigger className="h-10 max-w-[230px]">
              <SelectValue placeholder="Select your platform" />
            </SelectTrigger>
            <SelectContent className="w-[230px]">
              {options.map((value) => (
                <SelectItem value={value.value} key={value.value}>
                  {value.label}
                </SelectItem>
              ))}
            </SelectContent>
          </div>
        </Select>
        <PlatformFilter />
      </section>
    </>
  )
}

export { LibraryFilters }
