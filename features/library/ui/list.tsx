import { PropsWithChildren } from "react";

function List({ count, children }: PropsWithChildren<{ count: number }>) {
  return (
    <section className="flex w-full flex-col">
      <section className="mt-4 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2 md:gap-4 lg:grid-cols-5 lg:gap-7 xl:grid-cols-6">
        {children}
      </section>
    </section>
  );
}

export { List };
