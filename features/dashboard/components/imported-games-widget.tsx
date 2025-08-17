import { Download, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

type ImportedGamesWidgetProps = {
  count: number;
  isLoading?: boolean;
};

export function ImportedGamesWidget({
  count,
  isLoading = false,
}: ImportedGamesWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Imported Games</CardTitle>
          <Download className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Imported Games</CardTitle>
          <Download className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">
            Connect services to import games
          </p>
          <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
            <Link href="/user/settings?tab=integrations">
              <ExternalLink className="mr-2 size-3" />
              Connect Services
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <Link href="/collection/imported">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Imported Games</CardTitle>
          <Download className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">
            {count === 1 ? "Game ready to add" : "Games ready to add"}
          </p>
          <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
            <span>
              <ExternalLink className="mr-2 size-3" />
              View Imported Games
            </span>
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}
