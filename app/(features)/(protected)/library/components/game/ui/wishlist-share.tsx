import { Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { getServerUserId } from "@/lib/auth";

import { CopyLink } from "@/app/(features)/(protected)/library/components/game/ui/copy-link";

export async function WishlistShare() {
  const userId = await getServerUserId();

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
