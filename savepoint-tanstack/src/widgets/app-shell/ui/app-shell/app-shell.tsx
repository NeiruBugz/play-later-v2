import type { ReactNode } from "react";

export interface AppShellProps {
  /** Desktop left sidebar — already CSS-hidden below `md`. */
  sidebar?: ReactNode;
  /** Mobile sticky top bar — rendered above `main`, `md:hidden` internally. */
  mobileTopbar?: ReactNode;
  /** Mobile sticky bottom nav — rendered after `main`, `md:hidden` internally. */
  mobileBottomNav?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  sidebar,
  mobileTopbar,
  mobileBottomNav,
  children,
}: AppShellProps) {
  const hasMobileBottomNav = Boolean(mobileBottomNav);

  return (
    <div className="flex min-h-screen">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {mobileTopbar}
        <main
          className={
            hasMobileBottomNav
              ? "pb-bottom-nav min-w-0 flex-1"
              : "min-w-0 flex-1"
          }
        >
          {children}
        </main>
        {mobileBottomNav}
      </div>
    </div>
  );
}
