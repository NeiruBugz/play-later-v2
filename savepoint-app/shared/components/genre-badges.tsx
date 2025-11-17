import { Badge } from "@/shared/components/ui/badge";

export const GenreBadges = ({ genres }: { genres?: string[] }) => {
  if (!genres || genres.length === 0) {
    return null;
  }
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid="genre-badges-wrapper"
    >
      {genres.map((name) => (
        <Badge
          key={name}
          variant="secondary"
          className="flex h-6 items-center px-2 text-xs font-medium"
        >
          {name}
        </Badge>
      ))}
    </div>
  );
};
