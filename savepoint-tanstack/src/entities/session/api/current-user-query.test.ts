import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { currentUserQueryOptions } from "./current-user-query";
import { getCurrentUserFn } from "./get-current-user";
import { invalidateCurrentUser } from "./invalidate-current-user";

vi.mock("./get-current-user", () => ({
  getCurrentUserFn: vi.fn(),
}));

const signedIn = {
  user: { id: "u1", name: "Ada", username: "ada", image: null },
  statusModelNoticePending: false,
};

describe("currentUserQueryOptions", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.mocked(getCurrentUserFn).mockReset();
    vi.mocked(getCurrentUserFn).mockResolvedValue(signedIn);
    queryClient = new QueryClient();
  });

  describe("given the user was already resolved", () => {
    beforeEach(async () => {
      await queryClient.fetchQuery(currentUserQueryOptions);
    });

    it("serves the cached user without another server call", async () => {
      await queryClient.fetchQuery(currentUserQueryOptions);

      expect(getCurrentUserFn).toHaveBeenCalledTimes(1);
    });

    it("re-resolves the user after invalidateCurrentUser", async () => {
      await invalidateCurrentUser(queryClient);
      await queryClient.fetchQuery(currentUserQueryOptions);

      expect(getCurrentUserFn).toHaveBeenCalledTimes(2);
    });
  });
});
