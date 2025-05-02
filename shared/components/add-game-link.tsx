import { auth } from "@/auth";
import { Button } from "@/shared/components";
import Link from "next/link";

export async function AddGameLink() {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  return (
    <Link href="/collection/add-game">
      <Button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700">
        Add Game
      </Button>
    </Link>
  );
}
