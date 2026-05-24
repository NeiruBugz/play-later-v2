import type { PlatformOptions } from "../../../api/get-platform-options.constants";

export type PlatformComboboxProps = {
  /** The currently selected platform; "" means no platform. */
  value: string;
  /** Grouped platform options (game platforms first, then the user's). */
  groups: PlatformOptions;
  onChange: (value: string) => void;
  /**
   * Optional remote search over IGDB's platform catalog. Called with the
   * trimmed query once it reaches the minimum length; resolves to canonical
   * platform names. When omitted, the combobox filters local groups only.
   */
  searchRemote?: (query: string) => Promise<string[]>;
};
