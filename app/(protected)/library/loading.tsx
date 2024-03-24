import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="relative">
      <header className="container bg-background">
        <div className="flex flex-wrap justify-between">
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
            Library
          </h1>
          <Skeleton className="h-10 w-[160px]" />
          <Skeleton className="h-10 w-8  md:w-[230px]" />
        </div>
      </header>
      <div className="flex gap-2 px-4 md:container">
        {[1, 2, 3, 4].map((_) => (
          <Skeleton
            key={_}
            className="md:text-md h-6 w-8 cursor-pointer whitespace-nowrap border-b border-transparent px-1 text-[12px] transition-all duration-300 first-of-type:pl-0 hover:border-b hover:border-secondary md:p-2 "
          />
        ))}
      </div>
    </section>
  );
}
