import { Skeleton } from "@/shared/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-32" variant="title" />
      <Skeleton className="h-64 w-full" variant="card" />
    </div>
  );
}
