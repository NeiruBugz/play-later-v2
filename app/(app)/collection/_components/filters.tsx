import { Box, Flex } from '@chakra-ui/react';
import { PlatformFilter } from './filters/platform';
import { StatusFilter } from './filters/status';
import { Search } from './filters/search';
import { ClearFilters } from './filters/clear';
import { getUniqueUserPlatforms } from '@/features/backlog/actions/backlog-utility-actions';

export async function Filters() {
  const uniquePlatforms = await getUniqueUserPlatforms({});

  return (
    <Box my={2} hideBelow="md">
      <Flex>
        <StatusFilter />
      </Flex>
      <Flex gap={2} align="center" my={2}>
        {uniquePlatforms?.data ? (
          <PlatformFilter platformOptions={uniquePlatforms.data} />
        ) : null}
        <Search />
        <ClearFilters />
      </Flex>
    </Box>
  );
}
