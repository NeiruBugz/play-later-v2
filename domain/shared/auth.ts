import { getServerUserId } from "@/auth";

import { AuthenticationError } from "./errors";
import { failure, Result, success } from "./result";

export const requireAuthentication = async (): Promise<
  Result<string, AuthenticationError>
> => {
  try {
    const userId = await getServerUserId();

    if (!userId) {
      return failure(new AuthenticationError());
    }

    return success(userId);
  } catch (error) {
    return failure(new AuthenticationError("Failed to get user ID", error));
  }
};
