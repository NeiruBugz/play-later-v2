import { Button } from "@/shared/ui/button";
import { ModalFooter, ResponsiveModal } from "@/shared/ui/responsive-modal";

type RemoveFromLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameTitle: string;
  onConfirm: () => void;
};

export function RemoveFromLibraryDialog({
  open,
  onOpenChange,
  gameTitle,
  onConfirm,
}: RemoveFromLibraryDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <div
      className="contents"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <ResponsiveModal
        open={open}
        onOpenChange={onOpenChange}
        title={`Remove ${gameTitle} from your library?`}
        description="Its play history and rating will be deleted. Your notes stay in your Journal."
      >
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Remove
          </Button>
        </ModalFooter>
      </ResponsiveModal>
    </div>
  );
}
