"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useSearchParamsMutation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentValue = useCallback(
    (name: string) => searchParams.get(name) ?? "",
    [searchParams]
  );

  const handleParamsMutation = useCallback(
    (name: string, value: string) => {
      const currentSearch = new URLSearchParams(searchParams);
      currentSearch.set(name, value);

      startTransition(() => {
        router.push(`${pathname}?${currentSearch}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  const handleMultipleParamsMutation = useCallback(
    (params: Array<Record<string, string>>) => {
      const currentSearch = new URLSearchParams(searchParams);
      params.forEach((param) => {
        const [[key, value]] = Object.entries(param);
        currentSearch.set(key, value);
      });

      startTransition(() => {
        router.push(`${pathname}?${currentSearch}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  const handleParamsClear = useCallback(() => {
    const newParams = new URLSearchParams();
    router.push(`${pathname}?${newParams}`);
    startTransition(() => {
      router.push(`${pathname}?${newParams}`);
    });
  }, [pathname, router, startTransition]);

  const handleParamsDeleteByName = useCallback(
    (name: string) => {
      const currentSearch = new URLSearchParams(searchParams);
      currentSearch.delete(name);
    },
    [searchParams]
  );

  return {
    currentValue,
    handleParamsMutation,
    handleParamsClear,
    handleParamsDeleteByName,
    handleMultipleParamsMutation,
  };
}
