import { Badge } from "@/shared/components/ui/badge";

export const GenreBadges = ({ genres }: { genres?: string[] }) => {
  if (!genres || genres.length === 0) {
    return null;
  }
  return (
    <div
      className="gap-sm flex flex-wrap items-center"
      data-testid="genre-badges-wrapper"
    >
      {genres.map((name) => (
        <Badge
          key={name}
          variant="secondary"
          className="px-md flex h-6 items-center text-xs font-medium"
        >
          {name}
        </Badge>
      ))}
    </div>
  );
};
