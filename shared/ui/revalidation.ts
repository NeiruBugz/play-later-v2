import { revalidatePath } from "next/cache";

export const RevalidationService = {
  revalidateCollection: () => {
    revalidatePath("/collection");
  },

  revalidateGame: (gameId: string) => {
    revalidatePath(`/game/${gameId}`);
  },
};
