"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useSearchParamsMutation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentValue = useCallback(
    (name: string) => searchParams.get(name) ?? "",
    [searchParams]
  )

  const handleParamsMutation = useCallback(
    (name: string, value: string) => {
      const currentSearch = new URLSearchParams(searchParams)
      currentSearch.set(name, value)

      router.push(`${pathname}?${currentSearch}`)
    },
    [router, pathname, searchParams]
  )

  const handleMultipleParamsMutation = useCallback(
    (params: Array<Record<string, string>>) => {
      const currentSearch = new URLSearchParams(searchParams)
      params.forEach((param) => {
        const [[key, value]] = Object.entries(param)
        currentSearch.set(key, value)
      })

      router.push(`${pathname}?${currentSearch}`)
    },
    [router, pathname, searchParams]
  )

  const handleParamsClear = useCallback(() => {
    const currentSearch = new URLSearchParams(searchParams)
    for (const key in currentSearch.keys()) {
      currentSearch.delete(key)
    }
  }, [searchParams])

  const handleParamsDeleteByName = useCallback(
    (name: string) => {
      const currentSearch = new URLSearchParams(searchParams)
      currentSearch.delete(name)
    },
    [searchParams]
  )

  return {
    currentValue,
    handleParamsMutation,
    handleParamsClear,
    handleParamsDeleteByName,
    handleMultipleParamsMutation,
  }
}
