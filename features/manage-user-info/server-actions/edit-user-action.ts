"use server";

import { revalidatePath } from "next/cache";
import { zfd } from "zod-form-data";

import { updateUserData } from "@/shared/lib/repository";
import { authorizedActionClient } from "@/shared/lib/safe-action-client";

export const editUserAction = authorizedActionClient
  .metadata({
    actionName: "editUser",
    requiresAuth: true,
  })
  .inputSchema(
    zfd.formData({
      username: zfd.text(),
      steamProfileUrl: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await updateUserData({
      username: parsedInput.username,
      steamProfileUrl: parsedInput.steamProfileUrl || null,
      userId,
    });

    revalidatePath("/user/settings");
  });
