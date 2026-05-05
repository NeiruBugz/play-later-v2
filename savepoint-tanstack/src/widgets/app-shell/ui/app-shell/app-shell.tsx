import type { ReactNode } from "react";

export interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {sidebar && <aside className="w-64 shrink-0 border-r">{sidebar}</aside>}
      <main className="flex-1">{children}</main>
    </div>
  );
}
