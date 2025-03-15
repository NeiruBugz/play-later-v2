import { AppHeader } from '../../shared/components/ui/app-header';
import { Container } from '@chakra-ui/react';
import type { PropsWithChildren } from 'react';

export default function Layout(props: PropsWithChildren) {
  return (
    <Container px={4} minH="100vh" maxH="100vh">
      <AppHeader />
      {props.children}
    </Container>
  );
}
