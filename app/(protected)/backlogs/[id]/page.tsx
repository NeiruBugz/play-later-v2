import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsersBacklog } from "@/src/page-layer/backlog-id";
import { getUserList } from "@/src/entities/backlog/get-user-list";

export default async function Page(props: { params: { id: string } }) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }
  const games = await getUserList({ name: props.params.id });
  if (!games) {
    notFound();
  }

  return <UsersBacklog id={props.params.id} games={games} />;
}
