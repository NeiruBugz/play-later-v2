import { User } from "lucide-react";
import { Suspense } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { CurrentlyPlayingList } from "./currently-playing-list";
import { CurrentlyPlayingListSkeleton } from "./dashboard-skeletons";

export function CurrentlyPlaying() {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <User /> Currently Exploring
        </CardTitle>
        <CardDescription>Games you&apos;re actively exploring</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<CurrentlyPlayingListSkeleton />}>
          <CurrentlyPlayingList />
        </Suspense>
      </CardContent>
    </Card>
  );
}
