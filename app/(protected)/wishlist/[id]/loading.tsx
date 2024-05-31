import { Skeleton } from "@/src/shared/ui/skeleton";

export default function Loading() {
  return (
    <div className="px-4 md:container">
      <header className="flex items-center gap-2">
        <Skeleton className="h-[42px] w-[58px]" />
      </header>
      <section className="mt-6 flex flex-col flex-wrap gap-4 md:flex-row">
        <Skeleton className="h-[600px] w-full max-w-[400px]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[48px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[38px] w-full max-w-[400px]" />
          <Skeleton className="h-[116px] w-full max-w-[400px]" />
        </div>
        <Skeleton className="h-10 w-[228px] md:h-[228px] md:w-10" />
      </section>
      <section className="mt-6">
        <Skeleton className="mb-2 h-[48px] w-[400px]" />
        <Skeleton className="h-[120px] w-full" />
      </section>
    </div>
  );
}
