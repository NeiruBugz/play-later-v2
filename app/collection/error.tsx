"use client";

import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const handleReset = () => {
    reset();
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2>Something went wrong!</h2>
      <Button onClick={handleReset}>Try again</Button>
    </div>
  );
}
