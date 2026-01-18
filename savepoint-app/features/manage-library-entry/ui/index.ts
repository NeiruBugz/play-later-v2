// Main component exports
export { LibraryModal } from "./library-modal";
export type { LibraryModalProps } from "./library-modal.types";

// Field components
export { DateField } from "./date-field";
export type { DateFieldProps } from "./date-field.types";
export { DateFieldsCollapsible } from "./date-fields-collapsible";
export { StatusSelect } from "./status-select";
export type { StatusSelectProps } from "./status-select.types";
export { StatusChipGroup } from "./status-chip-group";
export { PlatformCombobox } from "./platform-combobox";
export type { PlatformComboboxProps } from "./platform-combobox.types";

// List and entry components
export { EntryForm } from "./entry-form";
export { EntryList } from "./entry-list";
export { EntryRow } from "./entry-row";
export { EntryTabs } from "./entry-tabs";

// Card and metadata components
export { LibraryItemCard } from "./library-item-card";
export type { LibraryItemCardProps } from "./library-item-card.types";
export { LibraryEntryMetadata } from "./library-entry-metadata";
export type { LibraryEntryMetadataProps } from "./library-entry-metadata.types";

// Dialog components
export { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
export type { DeleteConfirmationDialogProps } from "./delete-confirmation-dialog.types";
export { InlineDeleteConfirm } from "./inline-delete-confirm";

// Layout components
export { DesktopLayout } from "./desktop-layout";
export { MobileLayout } from "./mobile-layout";

// Form components
export { AddEntryForm } from "./add-entry-form";
export type { AddEntryFormProps } from "./add-entry-form.types";
export { EditEntryForm } from "./edit-entry-form";
export type { EditEntryFormProps } from "./edit-entry-form.types";

// Quick actions
export { QuickAddPopover } from "./quick-add-popover";
export type { QuickAddPopoverProps } from "./quick-add-popover.types";

// Constants
export * from "./constants";

// Hook exports
export { useLibraryModal } from "../hooks/use-library-modal";
export type {
  LibraryModalState,
  ModalAction,
  ModalView,
  UseLibraryModalReturn,
} from "../hooks/use-library-modal";
