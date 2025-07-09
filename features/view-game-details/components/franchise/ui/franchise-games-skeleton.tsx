import { FranchiseGameSkeleton } from "./franchise-game";

export function FranchiseGamesSkeleton({ gameCount }: { gameCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: gameCount }, (_, i) => (
        <FranchiseGameSkeleton key={i} />
      ))}
    </div>
  );
}
