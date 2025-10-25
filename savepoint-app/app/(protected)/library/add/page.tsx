import { GameSearchForm } from "@/features/add-game/ui";

export default function AddGamePage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Add Game to Library</h1>
      <GameSearchForm />
    </div>
  );
}
