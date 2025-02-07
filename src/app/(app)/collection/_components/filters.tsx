import { Flex } from "@chakra-ui/react";
import { PlatformFilter } from "./filters/platform";
import { getUniqueUserPlatforms } from "@/server/actions/backlogActions";
import { StatusFilter } from "@/app/(app)/collection/_components/filters/status";

export async function Filters() {
  const uniquePlatforms = await getUniqueUserPlatforms();

  return (
    <Flex direction="column" my={2}>
      <Flex>
        <StatusFilter />
      </Flex>
      <PlatformFilter platformOptions={uniquePlatforms} />
    </Flex>
  );
}
