"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "./ui/button";

export function BrowserBackButton() {
  const router = useRouter();
  const handleBackButtonClick = () => {
    router.back();
  };
  return (
    <Button
      variant="ghost"
      className="shrink-0"
      onClick={handleBackButtonClick}
    >
      <ArrowLeft /> Back
    </Button>
  );
}
