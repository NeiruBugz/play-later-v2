"use client";

import { Button, Input } from "@/shared/components";
import { cn } from "@/shared/lib";
import { Cross, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useState } from "react";

export function SearchInput() {
  const params = useSearchParams();
  const router = useRouter();

  const [inputValue, setInputValue] = useState(params.get("search") ?? "");

  useEffect(() => {
    if (inputValue.length === 0) {
      const paramsToUpdate = new URLSearchParams(params);

      paramsToUpdate.delete("search");

      router.replace(`/collection/?${paramsToUpdate.toString()}`);
    }
  }, [inputValue.length, params, router]);

  const onInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {
      currentTarget: { value },
    } = event;

    setInputValue(value);
  }, []);

  const onClear = () => {
    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.delete("search");

    router.replace(`/collection/?${paramsToUpdate.toString()}`);
    setInputValue("");
  };

  const onApply = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.set("search", inputValue);
    paramsToUpdate.set("page", "1");

    router.replace(`/collection/?${paramsToUpdate.toString()}`);
  }, [inputValue, params, router]);

  const handleEnterPress = useCallback(
    (event: KeyboardEvent) => {
      if (inputValue && event.key === "Enter") {
        onApply();
      }
    },
    [inputValue, onApply]
  );

  useEffect(() => {
    document.addEventListener("keypress", handleEnterPress);

    return () => {
      document.removeEventListener("keypress", handleEnterPress);
    };
  }, [handleEnterPress]);

  return (
    <div className="relative flex items-center gap-3">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          className="pl-9"
          value={inputValue}
          onChange={onInputChange}
        />
        <X
          className={cn(
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
            "cursor-pointer hover:text-foreground",
            {
              hidden: inputValue.length === 0,
            }
          )}
          onClick={onClear}
        />
      </div>
      <Button type="button" disabled={inputValue.length < 3} onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
