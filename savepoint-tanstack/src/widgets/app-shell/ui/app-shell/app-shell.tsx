import type { ReactNode } from "react";

export interface AppShellProps {
  sidebar?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {sidebar && (
        <aside className="sticky top-0 h-screen w-64 shrink-0 self-start border-r">
          {sidebar}
        </aside>
      )}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
