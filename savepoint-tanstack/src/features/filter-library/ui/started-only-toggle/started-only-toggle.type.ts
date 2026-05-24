export type StartedOnlyToggleProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Unique id so the label's `htmlFor` resolves when both surfaces mount. */
  id?: string;
};
