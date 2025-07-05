import { Clock } from "lucide-react";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";

import { ReleasesList } from "./releases-list";

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
        <Suspense fallback={"Loading..."}>
          <ReleasesList />
        </Suspense>
      </CardContent>
    </Card>
  );
}
