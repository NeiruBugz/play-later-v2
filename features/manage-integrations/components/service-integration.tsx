import { Button } from "@/shared/components";
import { cn } from "@/shared/lib/tailwind-merge";
import { ReactNode } from "react";

type ServiceIntegrationProps = {
  id: string;
  name: string;
  icon: ReactNode;
  isDisabled: boolean;
  description: string;
};

export function ServiceIntegration({
  name,
  icon,
  isDisabled,
  description,
}: ServiceIntegrationProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-sm border p-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-10 w-10 items-center justify-center")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" disabled={isDisabled}>
        {isDisabled ? "Coming soon" : "Connect"}
      </Button>
    </div>
  );
}
