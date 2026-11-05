import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { z } from "zod";

import { ErrorBoundary, NotFoundPage } from "@/app";

import "@/app/dev-console-error-expander";

import { SavepointThemeProvider } from "@/app/providers/theme-provider";
import { currentUserQueryOptions } from "@/entities/session/api/current-user-query";
import { AddGameAction, InlineAddConfirmationHost } from "@/features/add-game";
import { CommandPalette } from "@/features/command-palette";
import { StatusModelNotice, WhatsNewModal } from "@/features/whats-new";
import { Toaster } from "@/shared/ui/sonner";
import { AddFlowProvider } from "@/widgets/add-flow";
import { AppBottomNav } from "@/widgets/app-bottom-nav";
import { AppMobileTopbar } from "@/widgets/app-mobile-topbar";
import { AppShell } from "@/widgets/app-shell";
import { AppSidebar } from "@/widgets/app-sidebar";
import { DoneFlowProvider } from "@/widgets/done-flow";
import { GlobalActionHost } from "@/widgets/global-action-host";
import { NavigationProgress } from "@/widgets/navigation-progress";

import appCss from "../styles.css?url";

// Pre-hydration theme script. Runs in <head> before React mounts to prevent
// FOUC. Must stay in sync with the hand-rolled SavepointThemeProvider —
// theme value === CSS class name: light→"", dark→"dark", system→resolved via
// prefers-color-scheme. A stored retired theme (e.g. "cartridge") fails the
// validThemes check and falls back to 'system'. See DIVERGENCES.md → Slice 19
// for why this lives inline instead of inside `next-themes`.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var validThemes=['light','dark','system'];var mode=validThemes.indexOf(stored)!==-1?stored:'system';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var classMap={light:'',dark:'dark'};var resolved=mode==='system'?(prefersDark?'dark':'light'):mode;var nextClass=classMap[resolved];var root=document.documentElement;root.classList.remove('dark');if(nextClass){root.classList.add(nextClass)}if(mode==='system'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=(resolved==='dark')?'dark':'light';}catch(e){}})();`;

const rootSearchSchema = z.object({
  action: z.enum(["log-session", "add-game"]).optional(),
  game: z.string().min(1).optional(),
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  validateSearch: rootSearchSchema,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "SavePoint",
      },
      {
        name: "description",
        content:
          "A library, not a backlog. Curate your library across every platform and journal what made each game matter.",
      },
      { property: "og:title", content: "SavePoint" },
      {
        property: "og:description",
        content: "A library, not a backlog. For patient gamers.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SavePoint" },
      {
        name: "twitter:description",
        content: "A library, not a backlog. For patient gamers.",
      },
      { name: "twitter:image", content: "/og-image.png" },
      {
        name: "theme-color",
        content: "#f6f1e7",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#120f0c",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    links: [
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
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
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const { user, statusModelNoticePending } =
      await context.queryClient.fetchQuery(currentUserQueryOptions);
    return { user, statusModelNoticePending };
  },
  component: RootShell,
  shellComponent: RootDocument,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFoundPage,
});

export function RootShell() {
  const { user, statusModelNoticePending } = Route.useRouteContext();

  return (
    <SavepointThemeProvider defaultTheme="system">
      <NavigationProgress />
      <AddFlowProvider>
        <DoneFlowProvider>
          <AppShell
            sidebar={user ? <AppSidebar user={user} /> : undefined}
            mobileTopbar={user ? <AppMobileTopbar /> : undefined}
            mobileBottomNav={user ? <AppBottomNav /> : undefined}
          >
            <Outlet />
          </AppShell>
          {user ? (
            <CommandPalette
              wrapBody={(body) => (
                <InlineAddConfirmationHost>{body}</InlineAddConfirmationHost>
              )}
              renderAddAction={({ igdbId, name }) => (
                <AddGameAction game={{ igdbId, name, library: null }} />
              )}
            />
          ) : null}
          {user ? <GlobalActionHost /> : null}
        </DoneFlowProvider>
      </AddFlowProvider>
      {user && statusModelNoticePending ? <StatusModelNotice /> : null}
      {user && !statusModelNoticePending ? <WhatsNewModal /> : null}
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
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-primary/25">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
