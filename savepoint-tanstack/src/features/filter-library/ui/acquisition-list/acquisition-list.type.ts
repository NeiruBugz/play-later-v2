import type { LibraryAcquisition } from "@/features/filter-library/lib";

export type AcquisitionListProps = {
  current: LibraryAcquisition | undefined;
  onPick: (value: LibraryAcquisition) => void;
  variant: "sidebar" | "sheet";
};
