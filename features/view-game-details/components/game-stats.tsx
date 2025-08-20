import { Star } from "lucide-react";

import { Card, CardContent } from "@/shared/components/ui/card";

type GameStatsProps = {
  rating?: string;
};

export async function GameStats({ rating }: GameStatsProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <Star className="size-6 fill-yellow-400 text-yellow-400" />
          </div>
          <div className="text-2xl font-medium">
            {rating ?? "No rating yet"}
          </div>
          <div className="text-sm text-muted-foreground">Aggregated Rating</div>
        </div>
      </CardContent>
    </Card>
  );
}
