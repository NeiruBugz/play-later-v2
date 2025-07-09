import { Header } from "@/shared/components/header";
import { Skeleton } from "@/shared/components/ui/skeleton";

export default function Loader() {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen flex-col bg-background">
        <Header authorized={true} />
        <div className="container relative z-10 px-4 pt-[80px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr_250px]">
            {/* Left Column - Game Cover and Actions */}
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-lg border shadow-lg">
                <Skeleton className="aspect-[3/4] w-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Middle Column - Game Details */}
            <div className="flex flex-col gap-6">
              <div>
                <Skeleton className="mb-2 h-10 w-3/4" />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>

              {/* Tabs */}
              <div className="w-full">
                <div className="mb-4 flex w-fit gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            </div>

            {/* Right Column - Metadata and Similar Games */}
            <div className="flex flex-col gap-6">
              <div className="rounded-lg border p-4">
                <Skeleton className="mb-3 h-5 w-20" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              </div>

              <div>
                <Skeleton className="mb-3 h-5 w-24" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="aspect-[3/4] w-full" />
                  <Skeleton className="aspect-[3/4] w-full" />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <Skeleton className="mb-3 h-5 w-20" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Franchises Section */}
          <div className="mt-8">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="aspect-[3/4] w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
