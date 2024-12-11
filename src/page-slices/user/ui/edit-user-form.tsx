"use client";

import { Button, Input } from "@/src/shared/ui";
import { HiddenInput } from "@/src/shared/ui/hidden-input";
import { Label } from "@/src/shared/ui/label";
import { User } from "@prisma/client";
import { useFormState, useFormStatus } from "react-dom";
import { editUserAction } from "../api";

function SubmitButton() {
  const status = useFormStatus();

  return (
    <Button className="w-[300px]" disabled={status.pending}>
      Save
    </Button>
  );
}

export function EditUserForm({ userInfo }: { userInfo: User }) {
  const [state, action] = useFormState(editUserAction, {});

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
        <div className="flex flex-col gap-2">
          <Label>Steam Profile URL</Label>
          <Input name="steamProfileURL" defaultValue={userInfo.steamProfileURL ?? ""} />
        </div>
        <SubmitButton />
      </form>
    </div>
  );
}
