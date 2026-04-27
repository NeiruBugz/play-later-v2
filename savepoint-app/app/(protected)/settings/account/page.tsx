import type { Metadata } from "next";

import { LogoutButton } from "@/features/profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your SavePoint account",
};

export default function SettingsAccountPage() {
  return (
    <div>
      <h2 className="text-h2 mb-2xl">Account</h2>

      <Card className="hover:none w-full">
        <CardHeader>
          <CardTitle>Sign Out</CardTitle>
          <CardDescription>Sign out of your SavePoint account</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
