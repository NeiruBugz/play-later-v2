import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer';
import { Button, Flex } from '@chakra-ui/react';
import { IoFilterOutline } from 'react-icons/io5';
import { StatusFilter } from './filters/status';
import { PlatformFilter } from './filters/platform';
import { Search } from './filters/search';
import { ClearFilters } from './filters/clear';
import { getUniqueUserPlatforms } from '@/features/backlog/actions/backlog-utility-actions';

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
