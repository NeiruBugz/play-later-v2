"use client";

import { User } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { updateUsernameAction } from "@/src/features/edit-user";
import { Button, Input } from "@/src/shared/ui";
import { HiddenInput } from "@/src/shared/ui/hidden-input";
import { Label } from "@/src/shared/ui/label";

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button className="w-[300px]" disabled={status.pending}>
      Save
    </Button>
  );
}

export function EditUserForm({ userInfo }: { userInfo: User }) {
  const [state, action] = useFormState(updateUsernameAction, {});

  return (
    <div>
      <h1 className="my-2 font-bold md:text-xl xl:text-2xl">
        Edit User settings
      </h1>
      <form className="flex flex-col gap-3" action={action}>
        <HiddenInput name="userId" value={userInfo.id} />
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
