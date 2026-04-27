import type { ReactNode } from "react";

import { SettingsRail } from "@/widgets/settings-rail";
import { Separator } from "@/shared/components/ui/separator";

type SettingsLayoutProps = {
  children: ReactNode;
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="text-h1 mb-6">Settings</h1>
      <Separator className="mb-6" />
      <div className="md:grid md:grid-cols-[200px_1fr] md:gap-8">
        <aside aria-label="Settings navigation">
          <SettingsRail />
        </aside>
        <div className="mt-6 md:mt-0">{children}</div>
      </div>
    </div>
  );
}
