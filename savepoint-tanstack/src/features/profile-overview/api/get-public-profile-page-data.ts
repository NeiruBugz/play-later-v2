import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { getServerUserId } from "@/entities/session/api/get-session.server";

import {
  GET_PUBLIC_PROFILE_PAGE_DATA_INPUT,
  getPublicProfilePageDataWorker,
  type PublicProfilePageView,
} from "./get-public-profile-page-data.worker";

export const getPublicProfilePageDataFn = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) =>
    GET_PUBLIC_PROFILE_PAGE_DATA_INPUT.parse(value)
  )
  .handler(async ({ data }): Promise<PublicProfilePageView> => {
    const viewerId = await getServerUserId(getRequest());
    return getPublicProfilePageDataWorker(viewerId, data);
  });
