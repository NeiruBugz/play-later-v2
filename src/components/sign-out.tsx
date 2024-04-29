"use client";

import { DropdownMenuItem } from "@/src/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";


export const SignOut = () => (
  <DropdownMenuItem
    className="cursor-pointer"
    onClick={async () => {
      await signOut({ callbackUrl: "/", redirect: true });
    }}
  >
    <LogOut className="mr-2 size-4" />
    Logout
  </DropdownMenuItem>
);
