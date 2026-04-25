export { LibraryModal } from "./ui/library-modal";
export type { LibraryModalProps } from "./ui/library-modal.types";

export { DateField } from "./ui/date-field";
export type { DateFieldProps } from "./ui/date-field.types";
export { DateFieldsCollapsible } from "./ui/date-fields-collapsible";
export { StatusSelect } from "./ui/status-select";
export type { StatusSelectProps } from "./ui/status-select.types";
export { StatusChipGroup } from "./ui/status-chip-group";
export { PlatformCombobox } from "./ui/platform-combobox";
export type { PlatformComboboxProps } from "./ui/platform-combobox.types";

export { EntryForm } from "./ui/entry-form";
export { EntryList } from "./ui/entry-list";
export { EntryRow } from "./ui/entry-row";
export { EntryTabs } from "./ui/entry-tabs";

export { LibraryItemCard } from "./ui/library-item-card";
export type { LibraryItemCardProps } from "./ui/library-item-card.types";
export { LibraryEntryMetadata } from "./ui/library-entry-metadata";
export type { LibraryEntryMetadataProps } from "./ui/library-entry-metadata.types";

export { DeleteConfirmationDialog } from "./ui/delete-confirmation-dialog";
export type { DeleteConfirmationDialogProps } from "./ui/delete-confirmation-dialog.types";
export { InlineDeleteConfirm } from "./ui/inline-delete-confirm";

export { DesktopLayout } from "./ui/desktop-layout";
export { MobileLayout } from "./ui/mobile-layout";

export { AddEntryForm } from "./ui/add-entry-form";
export type { AddEntryFormProps } from "./ui/add-entry-form.types";
export { EditEntryForm } from "./ui/edit-entry-form";
export type { EditEntryFormProps } from "./ui/edit-entry-form.types";

export { QuickAddPopover } from "./ui/quick-add-popover";
export type { QuickAddPopoverProps } from "./ui/quick-add-popover.types";

export { QuickAddButton } from "./ui/quick-add-button";
export type { QuickAddButtonProps } from "./ui/quick-add-button";

export { STATUS_OPTIONS } from "./ui/constants";

export { useLibraryModal } from "./hooks/use-library-modal";
export type {
  LibraryModalState,
  ModalAction,
  ModalView,
  UseLibraryModalReturn,
} from "./hooks/use-library-modal";
export { useGetPlatforms } from "./hooks/use-get-platforms";

export {
  AddToLibrarySchema,
  UpdateLibraryStatusSchema,
  UpdateLibraryEntrySchema,
  UpdateLibraryStatusByIgdbSchema,
  GetLibraryStatusForGamesSchema,
  QuickAddToLibrarySchema,
} from "./schemas";
export type {
  AddToLibraryInput,
  UpdateLibraryStatusInput,
  UpdateLibraryEntryInput,
  UpdateLibraryStatusByIgdbInput,
  GetLibraryStatusForGamesInput,
  QuickAddToLibraryInput,
} from "./schemas";
