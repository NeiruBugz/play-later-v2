"use client";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { updateUserProfile } from "@/shared/services/user/actions";

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button className="w-[300px]" disabled={status.pending}>
      Save
    </Button>
  );
}

type EditUserFormProps = {
  userInfo: {
    name: string | null;
    username: string | null;
    steamProfileURL: string | null;
    steamConnectedAt: Date | null;
    email: string | null;
    id: string;
  };
};

export function EditUserForm({ userInfo }: EditUserFormProps) {
  const { execute } = useAction(updateUserProfile, {
    onSuccess: () => {
      toast.success("User updated");
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });
  return (
    <div>
      <h2 className="my-2 font-bold md:text-xl xl:text-2xl">
        Edit User settings
      </h2>
      <form className="flex flex-col gap-3" action={execute}>
        {userInfo.name ? (
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <Input name="name" defaultValue={userInfo.name} disabled />
          </div>
        ) : null}
        {userInfo.email ? (
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <Input name="email" defaultValue={userInfo.email} disabled />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label>Username</Label>
          <Input name="username" defaultValue={userInfo.username ?? ""} />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
