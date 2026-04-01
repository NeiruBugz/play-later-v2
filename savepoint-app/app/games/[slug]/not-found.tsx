"use client";

import { useParams } from "next/navigation";

import { GameNotFound } from "@/features/game-detail";

export default function GameNotFoundPage() {
  const params = useParams();
  const slug = (params.slug as string) || "";
  const initialQuery = slug.replace(/-/g, " ");
  return <GameNotFound initialQuery={initialQuery} />;
}
