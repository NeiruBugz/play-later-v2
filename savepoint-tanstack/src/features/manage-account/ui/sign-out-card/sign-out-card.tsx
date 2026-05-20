import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export interface SignOutCardProps {
  /**
   * Slot for the sign-out action button. Mounted at the route level (see
   * `routes/_authed/settings/account.tsx`) because cross-feature imports are
   * blocked by `eslint-plugin-boundaries` — routes are the legitimate
   * composition point for `auth-sign-out` + `manage-account`.
   */
  action: ReactNode;
}

export function SignOutCard({ action }: SignOutCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign out</CardTitle>
        <CardDescription>
          Sign out of your account on this device.
        </CardDescription>
      </CardHeader>
      <CardContent>{action}</CardContent>
    </Card>
  );
}
