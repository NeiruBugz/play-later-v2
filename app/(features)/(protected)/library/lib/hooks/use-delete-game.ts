import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

export function useDeleteGame() {
  const { replace } = useRouter();
  return useMutation({
    mutationKey: ["delete-game"],
    mutationFn: async (id: string) => {
      return fetch("/api/game", {
        method: "DELETE",
        body: JSON.stringify({ gameId: id }),
      });
    },
    onSuccess: () => {
      replace("/library?status=BACKLOG");
    },
  });
}
