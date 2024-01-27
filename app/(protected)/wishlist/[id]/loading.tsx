import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="px-4 md:container">
      <header className="flex items-center gap-2">
        <Skeleton className="w-[58px] h-[42px]" />
      </header>
      <section className="mt-6 flex flex-col flex-wrap gap-4 md:flex-row">
        <Skeleton className="w-full max-w-[400px] h-[600px]" />
        <div className="flex flex-col gap-4">
          <Skeleton className="w-full max-w-[400px] h-[48px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[38px]" />
          <Skeleton className="w-full max-w-[400px] h-[116px]" />
        </div>
        <Skeleton className="h-10 w-[228px] md:w-10 md:h-[228px]" />
      </section>
      <section className="mt-6">
        <Skeleton className="w-[400px] h-[48px] mb-2" />
        <Skeleton className="w-full h-[120px]" />
      </section>
    </div>
  )
}
