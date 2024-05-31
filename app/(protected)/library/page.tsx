import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Library } from "@/src/views/library";

import { LibraryPageProps } from "@/src/entities/game/types";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = new URLSearchParams(searchParams);
  const viewMode = (params?.get("viewMode") as "list" | "grid") ?? "list";

  return <Library viewMode={viewMode} params={params} />;
}
