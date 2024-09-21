import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/card";
import { ReleasesList } from "@/src/widgets/releases-list";
import { Clock } from "lucide-react";
import { Suspense } from "react";

export function UpcomingReleases() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Clock /> Upcoming releases
        </CardTitle>
        <CardDescription>List of your anticipated games</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          <ReleasesList />
        </Suspense>
      </CardContent>
    </Card>
  );
}
