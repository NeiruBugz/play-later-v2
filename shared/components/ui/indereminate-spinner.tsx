import { ProgressCircle } from '@chakra-ui/react';

export function IndeterminateSpinner() {
  return (
    <ProgressCircle.Root size="sm" value={null}>
      <ProgressCircle.Circle css={{ '--thickness': '4px' }}>
        <ProgressCircle.Track />
        <ProgressCircle.Range />
      </ProgressCircle.Circle>
    </ProgressCircle.Root>
  );
}
