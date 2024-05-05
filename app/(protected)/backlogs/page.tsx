import { auth } from "@/auth";
import { UserBacklog } from "@/src/components/backlogs/user-backlog";
import { LayoutHeader } from "@/src/components/ui/layout-header";
import { getList } from "@/src/queries/backlogs/get-list";
import { redirect } from "next/navigation";

type BackloggedWithUser = {
  id: string;
  imageUrl: string;
  title: string;
  user: {
    name?: null | string;
    username?: null | string;
  };
};

export default async function BacklogsPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const backlogs = await getList();
  return (
    <section className="relative">
      <LayoutHeader heading="Backlogs" />
      <div className="container mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {backlogs &&
            Object.keys(backlogs).map((backlogKey) => {
              const list = backlogs[
                backlogKey as keyof typeof backlogs
              ] as unknown as BackloggedWithUser[];
              return (
                <UserBacklog
                  backlogList={list}
                  key={backlogKey}
                  username={backlogKey}
                />
              );
            })}
        </div>
      </div>
    </section>
  );
}
