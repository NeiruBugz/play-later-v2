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

/**
 * App shell layout primitive. Accepts the sidebar + mobile chrome as slot
 * props (route composes which slots are present; this widget only positions
 * them). Below `md` the main column gets bottom padding so the fixed bottom
 * nav doesn't occlude page content.
 *
 * Phase 4 of the Slice 18A visual-parity push added the mobile slots.
 */
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
              ? "min-w-0 flex-1 pb-16 md:pb-0"
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
