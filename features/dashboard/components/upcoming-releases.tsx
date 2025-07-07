import { Clock } from "lucide-react";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";

import { ReleasesListSkeleton } from "./dashboard-skeletons";
import { ReleasesList } from "./releases-list";

export function UpcomingReleases() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Clock /> Upcoming releases
        </CardTitle>
        <CardDescription>List of your anticipated games</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ReleasesListSkeleton />}>
          <ReleasesList />
        </Suspense>
      </CardContent>
    </Card>
  );
}
