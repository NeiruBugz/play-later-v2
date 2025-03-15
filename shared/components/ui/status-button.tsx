'use client';

import { Button, useRecipe } from '@chakra-ui/react';
import { forwardRef } from 'react';

export type StatusType = 'playing' | 'completed' | 'backlog' | 'played';

export interface StatusButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  status: StatusType;
}

export const StatusButton = forwardRef<HTMLButtonElement, StatusButtonProps>(
  function StatusButton({ status, children, ...props }, ref) {
    const recipe = useRecipe({ key: 'StatusButton' });
    const styles = recipe({ status });

    return (
      <Button ref={ref} css={styles} size="xs" {...props}>
        {children}
      </Button>
    );
  },
);
