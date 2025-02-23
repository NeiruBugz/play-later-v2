import { Skeleton } from '@/components/ui/skeleton';
import { Box, Flex, Heading, HStack } from '@chakra-ui/react';

const fakeArray = Array(21)
  .fill(0)
  .map((_, index) => index + 1);

export default function Loading() {
  return (
    <Box>
      <Flex gap={2} align="center">
        <Heading as="h2">Collection</Heading>
      </Flex>
      <Box my={2} hideBelow="md">
        <Flex gap={1}>
          <Skeleton w="80px" h="32px" />
          <Skeleton w="80px" h="32px" />
          <Skeleton w="80px" h="32px" />
          <Skeleton w="80px" h="32px" />
          <Skeleton w="80px" h="32px" />
        </Flex>
        <Flex gap={2} align="center" my={2}>
          <Skeleton w="240px" h="32px" />
          <Skeleton w="240px" h="32px" />
          <Skeleton w="240px" h="32px" />
        </Flex>
      </Box>

      <Box>
        <HStack gap={2} justify="center" flexWrap="wrap" my={2}>
          {fakeArray.map((_) => {
            console.log(fakeArray);
            return <Skeleton w="138px" h="184px" key={_} />;
          })}
        </HStack>
      </Box>
    </Box>
  );
}
