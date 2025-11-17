type GameDescriptionProps = {
  summary?: string | null;
};
export function GameDescription({ summary }: GameDescriptionProps) {
  const displayText = summary?.trim() || "No description available";
  const isPlaceholder = !summary?.trim();
  return (
    <p
      className={`text-lg ${isPlaceholder ? "text-muted-foreground italic" : "text-muted-foreground"}`}
    >
      {displayText}
    </p>
  );
}
