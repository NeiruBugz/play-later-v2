"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { type PropsWithChildren } from "react";

import { Toaster } from "@/shared/components/ui/sonner";

const queryClient = new QueryClient();

export function Providers({
  children,
  ...props
}: PropsWithChildren<ThemeProviderProps>) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}
