import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "./get-session.server";

export const getCurrentUserIdFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ userId: string | undefined }> => {
    const request = getRequest();
    const userId = await getServerUserId(request);
    return { userId };
  }
);
