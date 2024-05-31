import React from "react";
import { useToast } from "@/src/shared/ui/use-toast";

export const useToastHandler = () => {
  const { toast } = useToast();
  return React.useCallback(
    (type: "error" | "success", name: string) => {
      if (type === "success") {
        toast({
          description: `${name} was successfully added to your games`,
          title: "Success",
        });
        return;
      }

      if (type === "error") {
        toast({
          description: `We couldn't add ${name} to your games`,
          title: "Oops, something happened",
          variant: "destructive",
        });
        return;
      }
    },
    [toast]
  );
};
