import { FullGameInfoResponse } from "@/src/shared/types";

export function getUniquePlatforms(
  releaseDates: FullGameInfoResponse["release_dates"] | undefined
) {
  if (!releaseDates || !releaseDates.length) {
    return [];
  }

  return releaseDates
    .filter(
      (record, index, self) =>
        index ===
        self.findIndex((r) => r.platform.name === record.platform.name)
    )
    .sort((a, b) => {
      const titleA = a.platform.name.toUpperCase();
      const titleB = b.platform.name.toUpperCase();
      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
      return 0;
    });
}
