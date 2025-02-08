import { Box, Flex } from "@chakra-ui/react";
import { PlatformFilter } from "./filters/platform";
import { getUniqueUserPlatforms } from "@/server/actions/backlogActions";
import { StatusFilter } from "@/app/(app)/collection/_components/filters/status";
import { Search } from "@/app/(app)/collection/_components/filters/search";
import { ClearFilters } from "@/app/(app)/collection/_components/filters/clear";

export async function Filters() {
  const uniquePlatforms = await getUniqueUserPlatforms();

  return (
    <Box my={2}>
      <Flex>
        <StatusFilter />
      </Flex>
      <Flex gap={2} align="center" my={2}>
        <PlatformFilter platformOptions={uniquePlatforms} />
        <Search />
        <ClearFilters />
      </Flex>
    </Box>
  );
}
