import { AppHeader } from '../../shared/components/ui/app-header';
import { Container } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';
import { GlobalImportStatus } from '@/features/import-steam-games/components/global-import-status';

export default function Layout(props: PropsWithChildren) {
  return (
    <Container px={4} minH="100vh" maxH="100vh">
      <AppHeader />
      {props.children}
      <GlobalImportStatus />
    </Container>
  );
}
