import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

type PlatformDetailPopoverProps = {
  detail: string;
  children: ReactNode;
};

export function PlatformDetailPopover({
  detail,
  children,
}: PlatformDetailPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={100}
        className="-my-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring md:m-0 md:min-h-0 md:min-w-0"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-xs gap-0 p-2">
        <p>{detail}</p>
      </PopoverContent>
    </Popover>
  );
}
