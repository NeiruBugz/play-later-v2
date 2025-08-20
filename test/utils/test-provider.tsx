import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { type PropsWithChildren } from "react";

import { TooltipProvider } from "@/shared/components/ui/tooltip";

const queryClient = new QueryClient();

export default function TestProviders({
  children,
  ...props
}: PropsWithChildren<ThemeProviderProps>) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}

export function renderWithTestProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}
