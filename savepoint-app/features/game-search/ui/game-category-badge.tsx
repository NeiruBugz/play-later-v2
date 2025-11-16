import { Badge } from "@/shared/components/ui/badge";
import { GameCategory } from "@/shared/constants/game";

import { getCategoryLabel } from "../lib/get-category-label";

interface GameCategoryBadgeProps {
  category: number;
}

export const GameCategoryBadge = ({ category }: GameCategoryBadgeProps) => {
  const label = getCategoryLabel(category);

  if (!label) {
    return null;
  }

  const variant = category === GameCategory.MAIN_GAME ? "default" : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
};
