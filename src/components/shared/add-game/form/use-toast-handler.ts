import { useToast } from "@/src/components/ui/use-toast";
import React from "react";

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
