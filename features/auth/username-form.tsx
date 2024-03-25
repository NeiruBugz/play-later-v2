import { revalidatePath } from "next/cache";
import { setUsername } from "@/features/auth/actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function UserNameForm({ show }: { show: boolean }) {
  async function handleSubmit(formData: FormData) {
    "use server";
    await setUsername({ username: formData.get("username") as string });
    revalidatePath("/library");
  }
  return (
    <Dialog open={show}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add username to your profile</DialogTitle>
        </DialogHeader>
        <section className="py-4">
          <form className="flex flex-col gap-2" action={handleSubmit}>
            <div>
              <Label>Username</Label>
              <Input type="text" name="username" />
            </div>
            <Button type="submit" className="w-fit">
              Update profile
            </Button>
          </form>
        </section>
      </DialogContent>
    </Dialog>
  );
}

export { UserNameForm };
