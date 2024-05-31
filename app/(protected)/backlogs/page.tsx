import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Backlogs } from "@/src/page-layer/backlogs";
import { getList } from "@/src/entities/backlog/get-list";

export default async function BacklogsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const backlogs = await getList();
  return <Backlogs backlogs={backlogs} />;
}
