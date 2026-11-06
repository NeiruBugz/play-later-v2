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

import { ThemeProvider } from "@/app/providers/theme-provider";
import { currentUserQueryOptions } from "@/entities/session/api/current-user-query";
import { AddGameAction, InlineAddConfirmationHost } from "@/features/add-game";
import { CommandPalette } from "@/features/command-palette";
import { StatusModelNotice, WhatsNewModal } from "@/features/whats-new";
import { getSiteOriginFn } from "@/shared/api/get-site-origin";
import { MANIFEST_PATH, socialMeta, THEME_COLORS } from "@/shared/config/site";
import { THEME_INIT_SCRIPT } from "@/shared/lib/theme/theme-init-script";
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

const FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&family=Zilla+Slab:wght@500;700&display=swap";

let siteOriginPromise: Promise<string> | undefined;

function getSiteOrigin(): Promise<string> {
  siteOriginPromise ??= getSiteOriginFn().catch((error: unknown) => {
    siteOriginPromise = undefined;
    throw error;
  });
  return siteOriginPromise;
}

const rootSearchSchema = z.object({
  action: z.enum(["log-session", "add-game"]).optional(),
  game: z.string().min(1).optional(),
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  validateSearch: rootSearchSchema,
  head: ({ loaderData }: { loaderData?: { siteOrigin: string } }) => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      ...socialMeta({
        siteOrigin: loaderData?.siteOrigin ?? "",
      }),
    ],
    links: [
      {
        rel: "manifest",
        href: MANIFEST_PATH,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
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
        rel: "preload",
        as: "style",
        href: FONTS_STYLESHEET,
      },
      {
        rel: "stylesheet",
        href: FONTS_STYLESHEET,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const [{ user, statusModelNoticePending }, siteOrigin] = await Promise.all([
      context.queryClient.fetchQuery(currentUserQueryOptions),
      getSiteOrigin(),
    ]);
    return { user, statusModelNoticePending, siteOrigin };
  },
  loader: async (): Promise<{ siteOrigin: string }> => ({
    siteOrigin: await getSiteOrigin(),
  }),
  component: RootShell,
  shellComponent: RootDocument,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFoundPage,
});

export function RootShell() {
  const { user, statusModelNoticePending } = Route.useRouteContext();

  return (
    <ThemeProvider defaultTheme="system">
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
    </ThemeProvider>
  );
}

export function ThemeColorMetas() {
  return (
    <>
      <meta
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content={THEME_COLORS.light}
      />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content={THEME_COLORS.dark}
      />
    </>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
        <ThemeColorMetas />
      </head>
      <body className="font-sans wrap-anywhere antialiased selection:bg-foreground/20">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
