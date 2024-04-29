import { auth } from "@/auth";
import { getList } from "@/src/actions/backlogs/get-list";
import { UserBacklog } from "@/src/components/backlogs/user-backlog";
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
    redirect('/')
  }

  const backlogs = await getList();
  return (
    <section className="relative">
      <header className="container sticky top-0 z-40 bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Backlogs
          </h1>
        </div>
      </header>
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
