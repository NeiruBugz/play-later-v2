import { UserAvatar } from './user';
import { Button, Flex, HStack, Link, Text } from '@chakra-ui/react';
import { Suspense } from 'react';
import NextLink from 'next/link';
import { SkeletonCircle } from './skeleton';
import { UserMenu } from './user-menu';
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from './menu';
import {
  IoGiftOutline,
  IoLibrary,
  IoLibraryOutline,
  IoMenuOutline,
} from 'react-icons/io5';

const linksConfig = [
  {
    href: '/collection?status=PLAYING&page=1',
    label: 'Collection',
    icon: <IoLibraryOutline />,
  },
  {
    href: '/wishlist?page=1',
    label: 'Wishlist',
    icon: <IoGiftOutline />,
  },
  {
    href: '/backlog',
    label: 'Backlogs',
    icon: <IoLibrary />,
  },
] as const;

export function AppHeader() {
  return (
    <Flex justify="space-between" w="full" py={2} align="center">
      <Flex align="center">
        <MenuRoot>
          <MenuTrigger hideFrom="md" mr={2}>
            <IoMenuOutline />
          </MenuTrigger>
          <MenuContent>
            {linksConfig.map((link) => (
              <MenuItem asChild key={link.href} value={link.href}>
                <Link asChild>
                  <Flex gap={1}>
                    {link.icon}
                    <NextLink href={link.href}>{link.label}</NextLink>
                  </Flex>
                </Link>
              </MenuItem>
            ))}
          </MenuContent>
        </MenuRoot>
        <Text fontWeight="bold" asChild>
          <NextLink href="/">PlayLater</NextLink>
        </Text>

        <HStack align="center" mx={2} hideBelow="md">
          {linksConfig.map((link) => (
            <Link key={`${link.href}-${link.label}`} asChild>
              <NextLink href={link.href}>{link.label}</NextLink>
            </Link>
          ))}
        </HStack>
      </Flex>
      <Flex gap={2} align="center">
        <Button variant="plain" asChild size="sm" colorPalette="blue">
          <Link asChild>
            <NextLink href="/collection/add">Add game</NextLink>
          </Link>
        </Button>
        <UserMenu>
          <Suspense fallback={<SkeletonCircle />}>
            <UserAvatar />
          </Suspense>
        </UserMenu>
      </Flex>
    </Flex>
  );
}
