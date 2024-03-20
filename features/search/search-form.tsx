"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm() {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  const onSubmit = useCallback(async () => {
    router.push(`/search?q=${searchValue}`);
  }, [router, searchValue]);

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
    <>
      <div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
        <Input
          name="searchQuery"
          id="searchQuery"
          type="text"
          placeholder="Start typing game name"
          value={searchValue}
          onChange={(event) => setSearchValue(event.currentTarget.value)}
          className="border-0 p-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent hover:font-bold"
          onClick={onSubmit}
          disabled={searchValue.length === 0}
        >
          <Search size={12} />
        </Button>
      </div>
    </>
  );
}
