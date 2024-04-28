"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export const SignOut = () => (
  <DropdownMenuItem
    className="cursor-pointer"
    onClick={() => {
      signOut({ redirect: true, callbackUrl: "/" });
    }}
  >
    <LogOut className="mr-2 size-4" />
    Logout
  </DropdownMenuItem>
);
