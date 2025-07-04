"use server";

import { authorizedActionClient } from "@/shared/lib/safe-action-client";
import { revalidatePath } from "next/cache";
import { zfd } from "zod-form-data";
import { updateUserName } from "./update-user-name";

export const editUserAction = authorizedActionClient
  .metadata({
    actionName: "editUser",
  })
  .inputSchema(
    zfd.formData({
      username: zfd.text(),
      steamProfileUrl: zfd.text().optional(),
    })
  )
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await updateUserName({
      ...parsedInput,
      id: userId,
    });

    revalidatePath("/user/settings");
  });
