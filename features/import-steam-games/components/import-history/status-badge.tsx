import { Badge } from '@chakra-ui/react';

function StatusBadge({ status }: { status: string }) {
  let color;
  switch (status) {
    case 'PENDING':
      color = 'yellow';
      break;
    case 'PROCESSING':
      color = 'blue';
      break;
    case 'COMPLETED':
      color = 'green';
      break;
    case 'FAILED':
      color = 'red';
      break;
    default:
      color = 'gray';
  }

  return (
    <Badge
      colorPalette={color}
      textTransform="uppercase"
      variant="subtle"
      px={2}
      py={0.5}
      borderRadius="full"
    >
      {status.toLowerCase()}
    </Badge>
  );
}

export { StatusBadge };
