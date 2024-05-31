import type { PropsWithChildren, ReactNode } from "react";

export const DashboardItemLayout = ({
  children,
  heading,
}: PropsWithChildren<{
  heading: ReactNode;
}>) => (
  <section className="mb-4 w-full rounded border p-3 md:w-fit">
    <h2 className="flex scroll-m-20 items-center gap-2 border-b pb-2 font-bold tracking-tight first:mt-0 md:text-2xl xl:text-3xl">
      {heading}
    </h2>
    <div className="mt-3 h-full w-full">{children}</div>
  </section>
);
