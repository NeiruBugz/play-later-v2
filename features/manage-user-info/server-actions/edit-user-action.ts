"use server";

import { revalidatePath } from "next/cache";
import { validateUpdateUsername } from "../lib/validation";
import { updateUserName } from "./update-user-name";

export async function editUserAction(prevState: any, payload: FormData) {
  const parsedPayload = validateUpdateUsername(payload);

  if (!parsedPayload.success) {
    return prevState;
  }

  await updateUserName(parsedPayload.data);

  revalidatePath(`/user/${parsedPayload.data.id}`);
  return prevState;
}
