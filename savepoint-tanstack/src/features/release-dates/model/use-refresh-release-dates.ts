import { useEffect } from "react";

import { refreshReleaseDatesFn } from "../api/refresh-release-dates";

export function useRefreshReleaseDates(): void {
  useEffect(() => {
    void Promise.resolve(refreshReleaseDatesFn()).catch(() => undefined);
  }, []);
}
