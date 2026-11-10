import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "@/entities/session/api/get-session.server";

import {
  LIST_CONNECTIONS_INPUT,
  listConnectionsWorker,
  type ListConnectionsResult,
} from "./list-connections.worker";

export const listConnectionsFn = createServerFn({ method: "GET" })
  .validator((data: unknown) => LIST_CONNECTIONS_INPUT.parse(data))
  .handler(async ({ data }): Promise<ListConnectionsResult> => {
    const viewerId = await getServerUserId(getRequest());
    return listConnectionsWorker(viewerId, data);
  });
