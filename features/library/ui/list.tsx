import { PropsWithChildren } from "react";

function List({ children }: PropsWithChildren) {
  return (
    <section className="flex w-full flex-col">
      <section className="mt-4 grid grid-flow-row grid-cols-1 items-center justify-items-center gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </section>
    </section>
  );
}

export { List };
