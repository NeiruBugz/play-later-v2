import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button, Flex } from '@chakra-ui/react';
import { IoFilterOutline } from 'react-icons/io5';
import { getUniqueUserPlatforms } from '@/features/collection/collection-utilitary-actions';
import { StatusFilter } from '@/app/(app)/collection/_components/filters/status';
import { PlatformFilter } from '@/app/(app)/collection/_components/filters/platform';
import { Search } from '@/app/(app)/collection/_components/filters/search';
import { ClearFilters } from '@/app/(app)/collection/_components/filters/clear';

export async function DrawerFilter() {
  const uniquePlatforms = await getUniqueUserPlatforms();
  return (
    <DrawerRoot placement="bottom" size="lg">
      <DrawerBackdrop />
      <DrawerTrigger asChild hideFrom="md">
        <Button variant="ghost" size="sm">
          <IoFilterOutline />
        </Button>
      </DrawerTrigger>
      <DrawerContent offset="3" rounded="md">
        <DrawerCloseTrigger />
        <DrawerHeader>
          <DrawerTitle>Collection filters</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <Flex direction="column" gap={3} mb="200px">
            <StatusFilter />
            <PlatformFilter platformOptions={uniquePlatforms} />
            <Search />
            <ClearFilters />
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </DrawerRoot>
  );
}
