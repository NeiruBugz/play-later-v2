import { getServerUserId } from "@/auth";
import { prisma } from "@/src/shared/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/shared/ui/card";
import { BacklogItemStatus } from "@prisma/client";
import { ListIcon } from "lucide-react";

export async function BacklogCount() {
  const userId = await getServerUserId();
  const backlogCount = await prisma.backlogItem.count({
    where: {
      userId,
      status: BacklogItemStatus.TO_PLAY,
    },
  });

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ListIcon /> Games in backlog
        </CardTitle>
        <CardDescription>Get disappointed in your life</CardDescription>
      </CardHeader>
      <CardContent>{backlogCount}</CardContent>
    </Card>
  );
}
