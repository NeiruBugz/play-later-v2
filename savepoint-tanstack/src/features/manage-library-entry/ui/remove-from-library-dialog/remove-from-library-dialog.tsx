import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{`Remove ${gameTitle} from your library?`}</DialogTitle>
          <DialogDescription>
            Its play history and rating will be deleted. Your notes stay in your
            Journal.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-sm">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
