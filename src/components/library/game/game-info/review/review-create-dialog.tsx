"use client";

import { useSession } from "next-auth/react";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { createReview } from "@/src/entities/review/create-review";
import { Button } from "@/src/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";
import { Textarea } from "@/src/shared/ui/textarea";

export const ReviewCreateDialog = ({ gameId }: { gameId: string }) => {
  const session = useSession();
  const [isOpen, setOpen] = useState(false);
  const { pending } = useFormStatus();
  const [state, formAction] = useActionState(createReview, { message: "" });
  const formId = useId();
  return (
    <Dialog onOpenChange={setOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add a review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your thougts about the game</DialogTitle>
        </DialogHeader>
        <form
          action={(payload) => {
            formAction(payload);
            setOpen(false);
          }}
          id={formId}
        >
          <input name="gameId" type="hidden" value={gameId} />
          <input name="userId" type="hidden" value={session.data?.user?.id} />
          <Textarea name="content" />
        </form>
        <div className="text-destructive">{state.message}</div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={pending} form={formId} type="submit">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
