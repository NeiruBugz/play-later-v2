'use client';
import { SessionProvider } from 'next-auth/react';
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from '@chakra-ui/react';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';

const config = defineConfig({});

const system = createSystem({ ...defaultConfig, ...config });

export function Provider(props: ColorModeProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={system}>
          <ColorModeProvider {...props} />
          <Toaster />
        </ChakraProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
