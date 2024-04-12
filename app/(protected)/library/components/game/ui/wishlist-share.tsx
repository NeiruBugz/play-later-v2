import { redirect } from "next/navigation";
import { getServerUserId } from "@/auth";
import { Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CopyLink } from "@/app/(protected)/library/components/game/ui/copy-link";

export async function WishlistShare() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Share <Share size={12} className="ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit max-w-[270px] space-y-4" align="end">
        <p className="text-sm font-medium">
          Share this link to your friends if they&apos;re struggling with gift
          ideas :)
        </p>
        <CopyLink userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
