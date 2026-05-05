import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "./get-session.server";

export const requireUserIdFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ userId: string }> => {
    const request = getRequest();
    const userId = await getServerUserId(request);

    if (!userId) {
      throw redirect({ to: "/login" });
    }

    return { userId };
  }
);
