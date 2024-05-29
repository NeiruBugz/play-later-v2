import type { BackloggedWithUser } from "@/src/types/backlogs";

export const Counter = ({
  backlogList,
}: {
  backlogList: BackloggedWithUser[];
}) => {
  return backlogList.length - 3 ? (
    <div className="absolute left-[135px] top-0 z-10 flex size-[92px] items-center justify-center rounded-xl bg-slate-200/85">
      <span className="text-xl font-bold">
        +&nbsp;
        {backlogList.length - 3}
      </span>
    </div>
  ) : (
    <></>
  );
};
