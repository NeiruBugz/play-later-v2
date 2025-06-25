"use client";

import { Button, Input } from "@/shared/components";
import { HiddenInput } from "@/shared/components/hidden-input";
import { Label } from "@/shared/components/label";
import { User } from "@prisma/client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { editUserAction } from "../server-actions/edit-user-action";

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button className="w-[300px]" disabled={status.pending}>
      Save
    </Button>
  );
}

export function EditUserForm({ userInfo }: { userInfo: User }) {
  const [state, action] = useActionState(editUserAction, {});

  return (
    <div>
      <h2 className="my-2 font-bold md:text-xl xl:text-2xl">
        Edit User settings
      </h2>
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
