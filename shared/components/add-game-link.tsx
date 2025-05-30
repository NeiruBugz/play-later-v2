import { auth } from "@/auth";
import { Button } from "@/shared/components";
import Link from "next/link";

export async function AddGameLink() {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  return (
    <Button className="h-8" asChild>
      <Link href="/collection/add-game" prefetch>
        Add Game
      </Link>
    </Button>
  );
}
