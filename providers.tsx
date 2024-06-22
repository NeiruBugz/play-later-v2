"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { PropsWithChildren, useState } from "react";
import { Toaster } from "@/src/shared/ui/toaster";


export default function Providers({
                                    children,
                                  }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster/>
      </QueryClientProvider>
    </SessionProvider>
  );
}
