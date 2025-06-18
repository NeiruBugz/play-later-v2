"use client";

import { Toaster } from "@/shared/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { PropsWithChildren, useState } from "react";

export default function Providers({
  children,
  ...props
}: PropsWithChildren<ThemeProviderProps>) {
  const [queryClient] = useState(() => new QueryClient());
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
