import type { PlatformOptions } from "../../../api/get-platform-options.constants";

export const NO_PLATFORM_LABEL = "No platform";
export const REMOTE_SEARCH_RESULTS_LABEL = "Search results";
export const REMOTE_SEARCH_MIN_LENGTH = 2;

const matches = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

const includesQuery = (haystack: string, query: string): boolean =>
  haystack.toLowerCase().includes(query.toLowerCase());

type VisibleGroup = {
  label: string;
  platforms: string[];
};

export type PlatformComboboxView = {
  visibleGroups: VisibleGroup[];
  remoteOnlyResults: string[];
  showRemoteSearching: boolean;
  showRemoteGroup: boolean;
  showCreate: boolean;
  showNoPlatform: boolean;
  hasAnyItem: boolean;
};

type ComputeVisibleItemsInput = {
  groups: PlatformOptions;
  value: string;
  trimmedQuery: string;
  remoteResults: string[];
  remoteEnabled: boolean;
  remoteLoading: boolean;
};

export function computeVisibleItems({
  groups,
  value,
  trimmedQuery,
  remoteResults,
  remoteEnabled,
  remoteLoading,
}: ComputeVisibleItemsInput): PlatformComboboxView {
  const visibleGroups = groups
    .map((group) => ({
      label: group.label,
      platforms: group.platforms.filter(
        (platform) =>
          trimmedQuery === "" || includesQuery(platform, trimmedQuery)
      ),
    }))
    .filter((group) => group.platforms.length > 0);

  const allPlatforms = groups.flatMap((group) => group.platforms);
  const isLocallyKnown = (platform: string): boolean =>
    matches(platform, value) ||
    allPlatforms.some((known) => matches(known, platform));

  const remoteOnlyResults = remoteResults.filter(
    (name) => !isLocallyKnown(name)
  );

  const showRemoteSearching = remoteEnabled && remoteLoading;
  const showRemoteGroup =
    remoteEnabled && (showRemoteSearching || remoteOnlyResults.length > 0);

  const showCreate =
    trimmedQuery !== "" &&
    !matches(trimmedQuery, NO_PLATFORM_LABEL) &&
    !allPlatforms.some((platform) => matches(platform, trimmedQuery));

  const showNoPlatform =
    trimmedQuery === "" || includesQuery(NO_PLATFORM_LABEL, trimmedQuery);

  const hasAnyItem =
    showCreate || showNoPlatform || showRemoteGroup || visibleGroups.length > 0;

  return {
    visibleGroups,
    remoteOnlyResults,
    showRemoteSearching,
    showRemoteGroup,
    showCreate,
    showNoPlatform,
    hasAnyItem,
  };
}
