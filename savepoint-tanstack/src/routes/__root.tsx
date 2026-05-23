import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";

import { ErrorBoundary } from "@/app";

import "@/app/dev-console-error-expander";

import { SavepointThemeProvider } from "@/app/providers/theme-provider";
import { getCurrentUserFn } from "@/entities/session/api";
import { CommandPalette } from "@/features/command-palette";
import { WhatsNewModal } from "@/features/whats-new";
import { Toaster } from "@/shared/ui/sonner";
import { AppBottomNav } from "@/widgets/app-bottom-nav";
import { AppMobileTopbar } from "@/widgets/app-mobile-topbar";
import { AppShell } from "@/widgets/app-shell";
import { AppSidebar } from "@/widgets/app-sidebar";

import appCss from "../styles.css?url";

// Pre-hydration theme script. Runs in <head> before React mounts to prevent
// FOUC. Must stay in sync with the hand-rolled SavepointThemeProvider —
// theme value === CSS class name: light→"", dark→"dark", cartridge→"cartridge",
// aurora→"aurora", system→resolved via prefers-color-scheme. See
// DIVERGENCES.md → Slice 19 for why this lives inline instead of inside
// `next-themes`.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var validThemes=['light','dark','cartridge','aurora','system'];var mode=validThemes.indexOf(stored)!==-1?stored:'system';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var classMap={light:'',dark:'dark',cartridge:'cartridge',aurora:'aurora'};var resolved=mode==='system'?(prefersDark?'dark':'light'):mode;var nextClass=classMap[resolved];var root=document.documentElement;root.classList.remove('dark','cartridge','aurora');if(nextClass){root.classList.add(nextClass)}if(mode==='system'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=(resolved==='dark')?'dark':'light';}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "SavePoint",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Bowlby+One&family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  loader: () => getCurrentUserFn(),
  component: RootShell,
  shellComponent: RootDocument,
  errorComponent: ErrorBoundary,
});

export function RootShell() {
  const { user } = Route.useLoaderData();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SavepointThemeProvider defaultTheme="system">
        <AppShell
          sidebar={user ? <AppSidebar user={user} /> : undefined}
          mobileTopbar={user ? <AppMobileTopbar /> : undefined}
          mobileBottomNav={user ? <AppBottomNav /> : undefined}
        >
          <Outlet />
        </AppShell>
        {user ? <CommandPalette /> : null}
        {user ? <WhatsNewModal /> : null}
        <Toaster />
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      </SavepointThemeProvider>
    </QueryClientProvider>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-[rgba(79,184,178,0.24)]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
