"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";
import { z } from "zod";

import { Button } from "@/src/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/shared/ui/dialog";
import { Form, FormField } from "@/src/shared/ui/form";
import { Input } from "@/src/shared/ui/input";
import { Label } from "@/src/shared/ui/label";
import { useToast } from "@/src/shared/ui/use-toast";

import { setUserName } from "@/src/entities/user/api/set-username";

const userDataSchema = z.object({
  email: z.string().email("Invalid email"),
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
});

type UserDataSchema = z.infer<typeof userDataSchema>;

export const UserSettings = ({
  userData,
}: {
  userData:
    | {
        email: string | undefined;
        id: string;
        name: string | undefined;
        username: string | undefined;
      }
    | null
    | undefined;
}) => {
  const [isOpen, setOpen] = useState(false);
  const form = useForm<UserDataSchema>({
    defaultValues: {
      email: userData?.email ?? "",
      id: userData?.id,
      name: userData?.name ?? "",
      username: userData?.username ?? "",
    },
    resolver: zodResolver(userDataSchema),
  });
  const { toast } = useToast();

  const onSubmit = async (data: UserDataSchema) => {
    try {
      await setUserName(data);
      setOpen(false);
      toast({
        description: "Your profile has been updated",
        title: "Success",
      });
    } catch (error) {
      console.error(error);
      toast({
        description: "We couldn't update your profile",
        title: "Oops, something happened",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className="relative flex h-8 w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-1.5 text-sm font-normal outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          variant="ghost"
        >
          <Settings className="mr-2 size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="user-settings" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <Input className="hidden" disabled {...field} />
              )}
            />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <>
                      <Label className="text-right" htmlFor="name">
                        Name
                      </Label>
                      <Input className="col-span-3" disabled {...field} />
                    </>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <>
                      <Label className="text-right" htmlFor="email">
                        Email
                      </Label>
                      <Input className="col-span-3" disabled {...field} />
                    </>
                  )}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <>
                      <Label className="text-right" htmlFor="username">
                        Username
                      </Label>
                      <Input className="col-span-3" {...field} />
                    </>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button form="user-settings" type="submit">
            {form.formState.isSubmitting ? (
              <FaSpinner className="mr-2 animate-spin" />
            ) : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
