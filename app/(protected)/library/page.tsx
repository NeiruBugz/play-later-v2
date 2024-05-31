import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Library } from "@/src/page-layer/library";
import { LibraryPageProps } from "@/src/types/library/components";

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = new URLSearchParams(searchParams);
  const viewMode = (params?.get("viewMode") as "list" | "grid") ?? "list";

  return <Library viewMode={viewMode} params={params} />;
}
