import { Skeleton, SkeletonText } from '@/shared/components/ui/skeleton';
import {
  Box,
  Container,
  Grid,
  GridItem,
  HStack,
  VStack,
} from '@chakra-ui/react';

export default function GamePageLoading() {
  return (
    <Container maxW="container.xl" py={6}>
      <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={8}>
        {/* Left column - Game cover and library entries */}
        <GridItem>
          <VStack gap={6} align="stretch">
            {/* Cover image skeleton */}
            <Skeleton height="450px" width="100%" borderRadius="md" />

            {/* Steam button skeleton */}
            <Skeleton height="40px" width="100%" borderRadius="md" />

            {/* Library entries skeleton */}
            <Box
              borderWidth="1px"
              borderRadius="md"
              p={4}
              borderColor="gray.200"
            >
              <Skeleton height="24px" width="150px" mb={4} />
              <SkeletonText mt={2} noOfLines={3} gap={4} h={4} />
              <Skeleton height="40px" width="100%" mt={4} />
            </Box>

            {/* How Long To Beat skeleton */}
            <Box
              borderWidth="1px"
              borderRadius="md"
              p={4}
              borderColor="gray.200"
            >
              <Skeleton height="24px" width="180px" mb={4} />
              <HStack gap={4} mt={4}>
                <Skeleton height="60px" width="100%" />
                <Skeleton height="60px" width="100%" />
              </HStack>
            </Box>
          </VStack>
        </GridItem>

        {/* Right column - Game details */}
        <GridItem>
          <VStack gap={6} align="stretch">
            {/* Title skeleton */}
            <Box>
              <Skeleton height="48px" width="80%" mb={4} />
              <HStack gap={4} mt={3} mb={6}>
                <Skeleton height="32px" width="120px" borderRadius="md" />
                <Skeleton height="32px" width="120px" borderRadius="md" />
              </HStack>
            </Box>

            {/* Genres skeleton */}
            <Box>
              <Skeleton height="24px" width="80px" mb={3} />
              <HStack gap={2} flexWrap="wrap">
                <Skeleton height="28px" width="100px" borderRadius="full" />
                <Skeleton height="28px" width="120px" borderRadius="full" />
                <Skeleton height="28px" width="80px" borderRadius="full" />
              </HStack>
            </Box>

            {/* Description skeleton */}
            <Box>
              <Skeleton height="24px" width="120px" mb={3} />
              <SkeletonText mt={2} noOfLines={6} gap={4} h={4} />
            </Box>

            {/* Additional IGDB data skeleton */}
            <Box>
              <Skeleton height="24px" width="150px" mb={3} />
              <SkeletonText mt={2} noOfLines={4} gap={4} h={4} />
            </Box>

            {/* Screenshots skeleton */}
            <Box>
              <Skeleton height="24px" width="120px" mb={3} />
              <Grid
                templateColumns={{
                  base: '1fr',
                  sm: '1fr 1fr',
                  md: '1fr 1fr 1fr',
                }}
                gap={4}
              >
                <Skeleton height="180px" borderRadius="md" />
                <Skeleton height="180px" borderRadius="md" />
                <Skeleton height="180px" borderRadius="md" />
              </Grid>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
}
