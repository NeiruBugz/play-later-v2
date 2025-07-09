import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function BacklogCountSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function CollectionStatsSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CurrentlyPlayingSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="flex w-full max-w-[420px] justify-start gap-3 overflow-x-auto">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 space-y-2">
              <Skeleton className="h-40 w-28 rounded-lg" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UpcomingReleasesSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivitySkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-full max-w-48" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformBreakdownSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-36" />
        </div>
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SteamIntegrationSkeleton() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export function CurrentlyPlayingListSkeleton() {
  return (
    <div className="flex w-full max-w-[420px] justify-start gap-3 overflow-x-auto">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 space-y-2">
          <Skeleton className="h-40 w-28 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ReleasesListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
