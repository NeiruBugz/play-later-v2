import { CopyLink } from "@/app/(protected)/library/components/game/ui/copy-link";
import { getServerUserId } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share } from "lucide-react";
import { redirect } from "next/navigation";

export async function WishlistShare() {
  const userId = await getServerUserId();

  if (!userId) {
    redirect("/");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          Share <Share className="ml-2" size={12} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-fit max-w-[270px] space-y-4">
        <p className="text-sm font-medium">
          Share this link to your friends if they&apos;re struggling with gift
          ideas :)
        </p>
        <CopyLink userId={userId} />
      </PopoverContent>
    </Popover>
  );
}
