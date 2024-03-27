import { PropsWithChildren } from "react";

export function List({ children }: PropsWithChildren) {
  return (
    <section className="flex w-full flex-col">
      <section className="mt-4 grid grid-cols-1 justify-items-start gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </section>
    </section>
  );
}
