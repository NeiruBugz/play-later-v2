import { Game } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";

export function useAddToLibrary() {
  return useMutation({
    mutationKey: ["add-to-library"],
    mutationFn: async (data: Omit<Game, "userId">) => {
      await fetch(`/api/library`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  });
}
