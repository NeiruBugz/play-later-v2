import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { UsersBacklog } from "@/src/views/backlog-id";

import { getBacklogListForUser } from "@/src/entities/game/api/get-backlog-for-user";

export default async function Page(props: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  const games = await getBacklogListForUser({ name: props.params.id });
  if (!games) {
    notFound();
  }

  return <UsersBacklog id={props.params.id} games={games} />;
}
