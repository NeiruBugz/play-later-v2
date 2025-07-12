import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import { PropsWithChildren } from "react";

const queryClient = new QueryClient();

export default function TestProviders({
  children,
  ...props
}: PropsWithChildren<ThemeProviderProps>) {
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </NextThemesProvider>
  );
}

export function renderWithTestProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}
