"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";

export function SearchForm() {
  const [searchValue, setSearchValue] = useState("");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const onSubmit = useCallback(async () => {
    startTransition(() => {
      router.push(`/search?q=${searchValue}`);
    });
  }, [router, searchValue, startTransition]);

  useEffect(() => {
    const onEnterPress = async (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        await onSubmit();
      }
    };

    document.addEventListener("keydown", onEnterPress);

    return () => {
      document.removeEventListener("keydown", onEnterPress);
    };
  }, [onSubmit]);

  return (
    <div className="relative">
      <Input
        name="searchQuery"
        id="searchQuery"
        type="text"
        placeholder="Start typing game name"
        value={searchValue}
        onChange={(event) => setSearchValue(event.currentTarget.value)}
      />
    </div>
  );
}
