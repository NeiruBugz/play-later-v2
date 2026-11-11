import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { auth } from "@/shared/lib/auth/auth.server";

import {
  getCurrentUserWorker,
  type CurrentUser,
} from "./get-current-user.worker";

export type { CurrentUser };

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return getCurrentUserWorker(session?.user ?? null);
  }
);
