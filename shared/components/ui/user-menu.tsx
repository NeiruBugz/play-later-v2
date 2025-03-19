'use client';

import { MenuContent, MenuRoot, MenuTrigger, MenuItem } from './menu';
import { Box, Button } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import { LuLogOut, LuSettings } from 'react-icons/lu';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export function UserMenu({ children }: PropsWithChildren) {
  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <Button variant="plain" w="fit" minW="fit" p="0" outline="none">
          {children}
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem value="settings" asChild disabled>
          <Link href="/settings">
            <LuSettings />
            <Box flex="1">Settings</Box>
          </Link>
        </MenuItem>
        <MenuItem value="logout" onClick={() => signOut()}>
          <LuLogOut />
          <Box flex="1">Log out</Box>
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
