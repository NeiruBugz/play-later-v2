import { PropsWithChildren } from "react";

export function List({ children }: PropsWithChildren) {
  return (
    <section className="flex w-full flex-col">
      <section className="mt-4 flex flex-wrap gap-2">{children}</section>
    </section>
  );
}
