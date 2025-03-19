import { Text, Flex, Heading } from '@chakra-ui/react';
import { auth } from '../auth';
import { SignIn } from '../shared/components/ui/sign-in';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    redirect('/collection');
  }

  return (
    <Flex h="100dvh" w="100dwv">
      <Flex
        h="100dvh"
        w="50dvw"
        flexDir="column"
        justify="center"
        align="start"
        bg="gray.900"
        p={10}
      >
        <Heading size="4xl" color="white">
          PlayLater
        </Heading>
        <Text color="white">
          Your ultimate game backlog companion. Track, wish, and conquer your
          gaming journey.
        </Text>
      </Flex>
      <Flex h="100dvh" w="50dvw" justify="center" align="center">
        <SignIn />
      </Flex>
    </Flex>
  );
}
