export type PlatformSelectProps = {
  value: string;
  platforms: ReadonlyArray<string>;
  /** Raw platform value from props — used to surface unknown-platform option. */
  rawPlatform: string | undefined;
  onChange: (raw: string) => void;
};
