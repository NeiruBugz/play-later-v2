import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export function AddGameButton() {
  return (
    <Button asChild variant="ghost">
      <Link href="/library/add">Add game</Link>
    </Button>
  );
}
