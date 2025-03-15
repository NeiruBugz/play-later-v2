import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider, createSystem } from '@chakra-ui/react';

// // Mock ChakraProvider for tests
// vi.mock('@chakra-ui/react', async (importOriginal) => {
//   const actual = await importOriginal();
//   return {
//     ...actual,
//     ChakraProvider: ({ children }: { children: React.ReactNode }) => (
//       <>{children}</>
//     ),
//   };
// });

// Add any providers your app needs here
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return <ChakraProvider value={createSystem()}>{children}</ChakraProvider>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: AllProviders,
      ...options,
    }),
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
