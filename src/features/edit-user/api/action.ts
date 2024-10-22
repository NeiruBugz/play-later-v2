"use server";

import { updateUserName } from "@/src/entities/user";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateUsernameSchema = z.object({
  id: z.string(),
  username: z.string(),
  steamProfileUrl: z.string(),
});

export async function updateUsernameAction(prevState: any, payload: FormData) {
  const parsedPayload = UpdateUsernameSchema.safeParse({
    id: payload.get("userId"),
    username: payload.get("username"),
    steamProfileUrl: payload.get("steamProfileURL"),
  });

  if (!parsedPayload.success) {
    return prevState;
  }

  await updateUserName(parsedPayload.data);

  revalidatePath(`/user/${parsedPayload.data.id}`);
  return prevState;
}
