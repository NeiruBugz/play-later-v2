import { auth } from "@/auth";
import { Button } from "@/src/shared/ui";
import Link from "next/link";

export async function AddGameLink() {
  const session = await auth();

  if (!session?.user) {
    return;
  }

  return (
    <Link
      href="/collection/add-game"
      className="cursor-pointer hover:underline"
    >
      <Button variant="link">Add Game</Button>
    </Link>
  );
}
