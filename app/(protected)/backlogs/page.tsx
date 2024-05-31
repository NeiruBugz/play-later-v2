import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Backlogs } from "@/src/views/backlogs";

import { getBacklogLists } from "@/src/entities/game/api/get-backlog-lists";

export default async function BacklogsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const backlogs = await getBacklogLists();
  return <Backlogs backlogs={backlogs} />;
}
