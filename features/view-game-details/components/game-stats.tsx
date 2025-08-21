import { Star } from "lucide-react";

import { Caption, Heading } from "@/shared/components/typography";
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
            <Star className="size-6 text-yellow-500" />
          </div>
          <Heading size="xl" className="font-medium">
            {rating ?? "No rating yet"}
          </Heading>
          <Caption>Aggregated Rating</Caption>
        </div>
      </CardContent>
    </Card>
  );
}
