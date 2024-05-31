import { UserBacklog } from "@/src/components/backlogs/user-backlog";
import type { BackloggedWithUser } from "@/src/types/backlogs";
import { LayoutHeader } from "@/src/shared/ui/layout-header";

export function Backlogs({
  backlogs,
}: {
  backlogs: Record<string, BackloggedWithUser[]> | never[] | undefined;
}) {
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
