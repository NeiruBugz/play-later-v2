"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa6";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

import { GetUserData } from "@/app/(protected)/settings/actions/get-user-data";
import { setUserName } from "@/app/login/lib/actions";

const userDataSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  username: z.string().min(1, "Username is required"),
});

type UserDataSchema = z.infer<typeof userDataSchema>;

export const UserSettings = ({
  userData,
}: {
  userData: GetUserData | null | undefined;
}) => {
  const [isOpen, setOpen] = useState(false);
  const form = useForm<UserDataSchema>({
    resolver: zodResolver(userDataSchema),
    defaultValues: {
      id: userData?.id,
      name: userData?.name ?? "",
      email: userData?.email ?? "",
      username: userData?.username ?? "",
    },
  });
  const { toast } = useToast();

  const onSubmit = async (data: UserDataSchema) => {
    try {
      await setUserName(data);
      setOpen(false);
      toast({
        title: "Success",
        description: "Your profile has been updated",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Oops, something happened",
        description: "We couldn't update your profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog onOpenChange={setOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex h-8 w-full cursor-default select-none items-center justify-start rounded-sm px-2 py-1.5 text-sm font-normal outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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
          <form onSubmit={form.handleSubmit(onSubmit)} id="user-settings">
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
                      <Label htmlFor="name" className="text-right">
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
                  render={({ field }) => (
                    <>
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input className="col-span-3" disabled {...field} />
                    </>
                  )}
                  name="email"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <>
                      <Label htmlFor="username" className="text-right">
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
          <Button type="submit" form="user-settings">
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
