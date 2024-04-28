import { memo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { IMAGE_API, IMAGE_SIZES } from "@/lib/config/site";

import { updateStatus } from "@/app/(protected)/library/lib/actions/update-game";
import type { PickerChoiceProps } from "@/app/(protected)/library/lib/types/components";

function PickerChoice({ choice, isRunning, afterClick }: PickerChoiceProps) {
  const onClick = async () => {
    if (isRunning) {
      return;
    }

    try {
      await updateStatus(choice.id, "INPROGRESS");
      afterClick();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div
      className="my-4 flex cursor-pointer flex-col items-center justify-center gap-4 border border-transparent p-4 hover:rounded-md hover:border hover:border-primary md:flex-row"
      onClick={onClick}
    >
      {!isRunning ? (
        <Avatar className="size-[90px] rounded-md">
          <AvatarImage
            className="size-[90px] object-cover"
            src={`${IMAGE_API}/${IMAGE_SIZES["hd"]}/${choice.imageUrl}.png`}
            alt={choice.title}
            width={90}
            height={90}
          />
          <AvatarFallback>{choice.title}</AvatarFallback>
        </Avatar>
      ) : null}
      <p className="text-center text-xl font-bold">{choice.title}</p>
    </div>
  );
}

const MemoizedChoice = memo(PickerChoice);

MemoizedChoice.displayName = "PickerChoice";

export { MemoizedChoice };
