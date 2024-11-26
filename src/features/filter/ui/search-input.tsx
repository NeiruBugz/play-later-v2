"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Button, Input } from "@/src/shared/ui";

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

  const onApply = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.set("search", inputValue);

    router.replace(`/collection/?${paramsToUpdate.toString()}`);
  }, [inputValue, params, router]);

  return (
    <div className="flex items-center gap-3">
      <Input
        className="md:w-[400px]"
        placeholder="Search by name"
        value={inputValue}
        onChange={onInputChange}
      />
      <Button type="button" disabled={inputValue.length < 3} onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}
